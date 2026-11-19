#!/usr/bin/env python3
"""
Convert downloaded textbook PDFs into optimized WebP page images, thumbnails,
and a structured books.json catalog for the digital textbook web app.
"""

import json
import os
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "source_pdfs"
OUT_DIR = ROOT / "site"
BOOKS_DIR = OUT_DIR / "books"
DATA_DIR = OUT_DIR / "data"

CATALOG = [
    {
        "id": "01-hiragana",
        "number": 1,
        "file": "01_hiragana.pdf",
        "driveId": "1utUh3wz6VNNhgKTq4-kRC1HujXkWg1RC",
        "title": "ひらがな",
        "subtitle": "ひらがな練習テキスト",
        "category": "kana",
        "categoryLabel": "かな",
        "level": "入門",
        "description": "ひらがなの読み方・書き方を基礎から学べるテキストです。",
    },
    {
        "id": "02-katakana",
        "number": 2,
        "file": "02_katakana.pdf",
        "driveId": "1tevAdBra8thRr53CeS25cXTU6MkcczjX",
        "title": "カタカナ",
        "subtitle": "カタカナ練習テキスト",
        "category": "kana",
        "categoryLabel": "かな",
        "level": "入門",
        "description": "カタカナの読み方・書き方と身近な外来語を学べるテキストです。",
    },
    {
        "id": "03-kana-chart",
        "number": 3,
        "file": "03_kana_chart.pdf",
        "driveId": "1Sn9Nj1aWC12oSWm4xwCVpIJWRrQhP3YD",
        "title": "ひらがな・カタカナ一覧表",
        "subtitle": "五十音・濁音・拗音チャート",
        "category": "kana",
        "categoryLabel": "かな",
        "level": "入門",
        "description": "ひらがなとカタカナを一覧で確認できるリファレンス表です。",
    },
    {
        "id": "04-shiori",
        "number": 4,
        "file": "04_shiori.pdf",
        "driveId": "1mpVU0oyDtbFVb-KttGKENqcT1KesTb6M",
        "title": "にほんご しおり",
        "subtitle": "学習ガイド・基本表現",
        "category": "conversation",
        "categoryLabel": "かいわ・しおり",
        "level": "入門〜初級",
        "description": "日本語学習のしおりと日常で役立つ基本表現をまとめています。",
    },
    {
        "id": "05-kaiwa1",
        "number": 5,
        "file": "05_kaiwa1.pdf",
        "driveId": "1RPJn7m49ljZaksZdwBypSvrkFVndc2zV",
        "title": "にほんご かいわ 1",
        "subtitle": "日常会話テキスト",
        "category": "conversation",
        "categoryLabel": "かいわ・しおり",
        "level": "初級",
        "description": "毎日の生活でよく使うあいさつや会話を練習するテキストです。",
    },
    {
        "id": "06-kanji1",
        "number": 6,
        "file": "06_kanji1.pdf",
        "driveId": "1Ovf2JZBiqVKIafjLQvdUn7RGSGUBp0aH",
        "title": "かんじ 1",
        "subtitle": "はじめての漢字 その1",
        "category": "kanji",
        "categoryLabel": "かんじ",
        "level": "初級",
        "description": "生活に身近な基本漢字からスタートする漢字テキスト第1冊です。",
    },
    {
        "id": "07-kanji2",
        "number": 7,
        "file": "07_kanji2.pdf",
        "driveId": "1CTtgxkfMxQLmdehn4wcLENLvTvy39uQ2",
        "title": "はじめてのかんじ その2",
        "subtitle": "基本漢字テキスト 第2冊",
        "category": "kanji",
        "categoryLabel": "かんじ",
        "level": "初級",
        "description": "「かんじ1」に続いて基本漢字の読み書きを広げるテキストです。",
    },
    {
        "id": "08-kanji3",
        "number": 8,
        "file": "08_kanji3.pdf",
        "driveId": "1zAzIa-kFwDa23WS4OFXeR8Bww9f2LNPv",
        "title": "はじめてのかんじ その3",
        "subtitle": "基本漢字テキスト 第3冊",
        "category": "kanji",
        "categoryLabel": "かんじ",
        "level": "初級",
        "description": "日常でよく目にする漢字をステップアップして学ぶ第3冊です。",
    },
    {
        "id": "09-kanji4",
        "number": 9,
        "file": "09_kanji4.pdf",
        "driveId": "1dlApl1JEQ0nzTd9cl2g6vfdn6F7LBu8N",
        "title": "はじめてのかんじ その4",
        "subtitle": "基本漢字テキスト 第4冊",
        "category": "kanji",
        "categoryLabel": "かんじ",
        "level": "初級〜中級",
        "description": "語彙と漢字表現をさらに充実させる漢字テキスト第4冊です。",
    },
    {
        "id": "10-kanji5",
        "number": 10,
        "file": "10_kanji5.pdf",
        "driveId": "1gCYNcKJxvbSckvc6ISx_cUstUdWKqq8n",
        "title": "はじめてのかんじ その5",
        "subtitle": "基本漢字テキスト 第5冊",
        "category": "kanji",
        "categoryLabel": "かんじ",
        "level": "初級〜中級",
        "description": "「はじめてのかんじ」シリーズの総仕上げとなる第5冊です。",
    },
    {
        "id": "11-yomimono-shokyu1",
        "number": 11,
        "file": "11_yomimono_shokyu1.pdf",
        "driveId": "1umL3pW4_8BGD15l7YdR6ydeRvY6OjANK",
        "title": "にほんご よみもの 初級1",
        "subtitle": "初級リーディング教材",
        "category": "reading",
        "categoryLabel": "よみもの",
        "level": "初級",
        "description": "やさしい日本語で楽しく読める初級向けの読み物テキストです。",
    },
    {
        "id": "12-yomimono-chukyu1",
        "number": 12,
        "file": "12_yomimono_chukyu1.pdf",
        "driveId": "14Hvljz1Y4aJr58_zbCa7Ih4rDNyfChkp",
        "title": "にほんご よみもの 中級1",
        "subtitle": "中級リーディング教材 1",
        "category": "reading",
        "categoryLabel": "よみもの",
        "level": "中級",
        "description": "日本の暮らしや文化をテーマにした中級向け読み物第1冊です。",
    },
    {
        "id": "13-yomimono-chukyu2",
        "number": 13,
        "file": "13_yomimono_chukyu2.pdf",
        "driveId": "1I0Sv4i6VEDKSsrloIVMKAty_CZN9CHZX",
        "title": "にほんご よみもの 中級2",
        "subtitle": "中級リーディング教材 2",
        "category": "reading",
        "categoryLabel": "よみもの",
        "level": "中級",
        "description": "さらに読みごたえのある話題を楽しめる中級向け読み物第2冊です。",
    },
]

MAX_PAGE_DIM = 1600
THUMB_WIDTH = 320


def render_page_to_webp(page: fitz.Page, out_path: Path, thumb_path: Path):
    rect = page.rect
    max_side = max(rect.width, rect.height)
    scale = min(2.2, MAX_PAGE_DIM / max_side) if max_side > 0 else 2.0
    scale = max(scale, 1.5)
    mat = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat, alpha=False)

    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img.save(out_path, "WEBP", quality=84, method=4)

    thumb_ratio = THUMB_WIDTH / img.width
    thumb_height = max(1, int(img.height * thumb_ratio))
    thumb = img.resize((THUMB_WIDTH, thumb_height), Image.Resampling.LANCZOS)
    thumb.save(thumb_path, "WEBP", quality=76, method=4)

    return pix.width, pix.height


def main():
    BOOKS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    books_output = []

    for item in CATALOG:
        pdf_path = PDF_DIR / item["file"]
        if not pdf_path.exists():
            print(f"[WARN] Missing PDF: {pdf_path}")
            continue

        book_id = item["id"]
        pages_dir = BOOKS_DIR / book_id / "pages"
        thumbs_dir = BOOKS_DIR / book_id / "thumbs"
        pages_dir.mkdir(parents=True, exist_ok=True)
        thumbs_dir.mkdir(parents=True, exist_ok=True)

        doc = fitz.open(pdf_path)
        page_count = len(doc)
        print(f"Processing [{item['number']:02d}] {item['title']} ({page_count} pages)...")

        pages_meta = []
        for idx in range(page_count):
            page = doc[idx]
            p_num = idx + 1
            page_file = f"p{p_num:03d}.webp"
            out_path = pages_dir / page_file
            thumb_path = thumbs_dir / page_file

            if out_path.exists() and thumb_path.exists():
                with Image.open(out_path) as existing:
                    w, h = existing.size
            else:
                w, h = render_page_to_webp(page, out_path, thumb_path)

            text_snippet = " ".join(page.get_text("text").split())[:200]
            pages_meta.append(
                {
                    "page": p_num,
                    "image": f"books/{book_id}/pages/{page_file}",
                    "thumb": f"books/{book_id}/thumbs/{page_file}",
                    "width": w,
                    "height": h,
                    "snippet": text_snippet,
                }
            )

        doc.close()

        first_page = pages_meta[0] if pages_meta else None
        is_landscape = bool(first_page and first_page["width"] > first_page["height"])

        books_output.append(
            {
                "id": book_id,
                "number": item["number"],
                "title": item["title"],
                "subtitle": item["subtitle"],
                "category": item["category"],
                "categoryLabel": item["categoryLabel"],
                "level": item["level"],
                "description": item["description"],
                "driveUrl": f"https://drive.google.com/file/d/{item['driveId']}/view",
                "pageCount": page_count,
                "isLandscape": is_landscape,
                "cover": first_page["thumb"] if first_page else "",
                "pages": pages_meta,
            }
        )

    out_json = DATA_DIR / "books.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(
            {
                "siteTitle": "春日部日本語教室 デジタルテキストブック",
                "sourceFolderUrl": "https://drive.google.com/drive/folders/12PFpwx4abhBnZGUNfvtQTwJCdiCeBcdz",
                "totalBooks": len(books_output),
                "totalPages": sum(b["pageCount"] for b in books_output),
                "books": books_output,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"Done! Wrote {out_json} ({len(books_output)} books, {sum(b['pageCount'] for b in books_output)} pages).")


if __name__ == "__main__":
    main()
