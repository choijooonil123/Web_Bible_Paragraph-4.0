from __future__ import annotations

import json
from functools import lru_cache
from math import ceil
from pathlib import Path
from typing import Any, Dict, List, Tuple

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field


ROOT = Path(__file__).parent
DATA_PATH = ROOT / "bible-paragraphs.json"
LOCALSTORAGE_PATH = ROOT / "data" / "localstorage.json"


def _flatten_para(book: str, chapter: int, para_idx: int, para: Dict[str, Any]) -> Dict[str, Any]:
    verses = para.get("verses", [])
    text_parts: List[str] = []
    for verse in verses:
        if isinstance(verse, list) and len(verse) > 1:
            text_parts.append(str(verse[1]))
    flat_text = " ".join(text_parts)
    return {
        "book": book,
        "chapter": chapter,
        "para_index": para_idx,
        "ref": para.get("ref", ""),
        "title": para.get("title", ""),
        "text": flat_text,
        "text_lower": flat_text.lower(),
    }


@lru_cache(maxsize=1)
def load_bible_raw() -> Dict[str, Any]:
    if not DATA_PATH.exists():
        raise RuntimeError(f"데이터 파일을 찾을 수 없습니다: {DATA_PATH}")
    with DATA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_bible() -> Dict[str, Any]:
    raw = load_bible_raw()
    books = raw.get("books", {})
    book_list: List[Dict[str, Any]] = []
    chapters_map: Dict[str, List[Dict[str, Any]]] = {}
    paras_index: List[Dict[str, Any]] = []

    for book_name, chapters in books.items():
        chapter_keys = sorted(chapters.keys(), key=lambda x: int(x))
        book_list.append({"book": book_name, "chapter_count": len(chapter_keys)})
        chapters_map[book_name] = []

        for ch_key in chapter_keys:
            ch_data = chapters[ch_key]
            ch_num = int(ch_key)
            para_entries: List[Dict[str, Any]] = []
            first_ref = ""
            first_title = ""

            for idx, para in enumerate(ch_data.get("paras", [])):
                flattened = _flatten_para(book_name, ch_num, idx, para)
                para_entries.append(flattened)
                paras_index.append(flattened)
                if idx == 0:
                    first_ref = str(para.get("ref", ""))
                    first_title = str(para.get("title", ""))

            chapters_map[book_name].append(
                {
                    "chapter": ch_num,
                    "title": ch_data.get("title", ""),
                    "para_count": len(para_entries),
                    "first_ref": first_ref,
                    "first_title": first_title,
                    "paras": para_entries,
                }
            )

    return {
        "meta": raw.get("meta", {}),
        "books": book_list,
        "chapters": chapters_map,
        "paras_index": paras_index,
    }


app = FastAPI(title="Bible Paragraphs (Python)", version="1.0.0")
templates = Jinja2Templates(directory=str(ROOT / "templates"))
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")


def _pick_book_and_chapter(book: str | None, chapter: int | None, data: Dict[str, Any]) -> Tuple[str, int | None]:
    if not data["books"]:
        raise HTTPException(status_code=500, detail="성경 데이터가 없습니다.")

    book_names = [b["book"] for b in data["books"]]
    selected_book = book if book in data["chapters"] else book_names[0]
    available_chapters = data["chapters"].get(selected_book, [])

    if not available_chapters:
        return selected_book, None
    if chapter is None:
        return selected_book, available_chapters[0]["chapter"]

    valid = {c["chapter"] for c in available_chapters}
    return selected_book, chapter if chapter in valid else available_chapters[0]["chapter"]


@app.get("/py", response_class=HTMLResponse)
async def home(
    request: Request,
    book: str | None = None,
    chapter: int | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
):
    data = load_bible()
    selected_book, selected_chapter = _pick_book_and_chapter(book, chapter, data)
    available_chapters = data["chapters"].get(selected_book, [])

    results: List[Dict[str, Any]] = []
    mode = "chapter"
    query = (q or "").strip()
    page_size = 20
    total_count = 0
    page_count = 0

    if query:
        mode = "search"
        ql = query.lower()
        all_results = [
            p
            for p in data["paras_index"]
            if ql in p["text_lower"] or ql in p.get("title", "").lower() or ql in p.get("ref", "").lower()
        ]
        total_count = len(all_results)
        page_count = ceil(total_count / page_size) if total_count else 0
        start = (page - 1) * page_size
        results = all_results[start : start + page_size]
    elif selected_chapter is not None:
        for ch in available_chapters:
            if ch["chapter"] == selected_chapter:
                results = ch["paras"]
                break

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "meta": data.get("meta", {}),
            "books": data["books"],
            "chapters": available_chapters,
            "selected_book": selected_book,
            "selected_chapter": selected_chapter,
            "query": query,
            "results": results,
            "mode": mode,
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "page_count": page_count,
        },
    )


@app.get("/api/books", response_class=JSONResponse)
async def api_books():
    data = load_bible()
    return {"books": data["books"]}


@app.get("/api/chapters/{book}", response_class=JSONResponse)
async def api_chapters(book: str):
    data = load_bible()
    chapters = data["chapters"].get(book)
    if chapters is None:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다.")
    return {
        "book": book,
        "chapters": [
            {
                "chapter": ch["chapter"],
                "title": ch.get("title", ""),
                "para_count": ch.get("para_count", len(ch.get("paras", []))),
                "first_ref": ch.get("first_ref", ""),
                "first_title": ch.get("first_title", ""),
            }
            for ch in chapters
        ],
    }


@app.get("/api/paragraphs/{book}/{chapter}", response_class=JSONResponse)
async def api_paragraphs(book: str, chapter: int):
    raw = load_bible_raw()
    book_data = raw.get("books", {}).get(book)
    if book_data is None:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다.")

    ch_data = book_data.get(str(chapter))
    if ch_data is None:
        raise HTTPException(status_code=404, detail="장 정보를 찾을 수 없습니다.")

    return {
        "book": book,
        "chapter": chapter,
        "title": ch_data.get("title", ""),
        "paras": ch_data.get("paras", []),
    }


@app.get("/api/search", response_class=JSONResponse)
async def api_search(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    data = load_bible()
    ql = q.lower()
    results = [
        {
            "book": p["book"],
            "chapter": p["chapter"],
            "para_index": p["para_index"],
            "ref": p["ref"],
            "title": p["title"],
            "text": p["text"],
        }
        for p in data["paras_index"]
        if ql in p["text_lower"] or ql in p.get("title", "").lower() or ql in p.get("ref", "").lower()
    ]
    total = len(results)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "query": q,
        "count": total,
        "page": page,
        "page_size": page_size,
        "page_count": ceil(total / page_size) if total else 0,
        "results": results[start:end],
    }


class LocalStorageSync(BaseModel):
    items: Dict[str, Any] = Field(default_factory=dict, description="Key-value pairs from browser localStorage")


def _ensure_localstorage_file() -> None:
    LOCALSTORAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not LOCALSTORAGE_PATH.exists():
        LOCALSTORAGE_PATH.write_text("{}", encoding="utf-8")


@app.get("/api/localstorage", response_class=JSONResponse)
async def get_localstorage():
    _ensure_localstorage_file()
    try:
        data = json.loads(LOCALSTORAGE_PATH.read_text(encoding="utf-8"))
    except Exception:
        data = {}
    return {"items": data}


@app.post("/api/localstorage", response_class=JSONResponse)
async def save_localstorage(payload: LocalStorageSync):
    _ensure_localstorage_file()
    try:
        LOCALSTORAGE_PATH.write_text(json.dumps(payload.items, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로컬스토리지 저장 실패: {e}")
    return {"status": "ok", "saved": len(payload.items)}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)


app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="root-static")
