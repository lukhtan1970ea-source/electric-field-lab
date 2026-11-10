import streamlit as st
import streamlit.components.v1 as components
import os

def interactive_bench(stage_name, key=None):
    """
    Збирає index.html, style.css та три JS-модулі (state.js, draw.js, events.js)
    в один моноліт перед рендерингом в iFrame.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))

    def read_file(filename):
        with open(os.path.join(current_dir, filename), "r", encoding="utf-8") as f:
            return f.read()

    html_code = read_file("index.html")
    css_code = read_file("style.css")
    state_js = read_file("state.js").replace(
        'let currentStage = "stage1";',
        f'let currentStage = "{stage_name}";'
    )
    draw_js = read_file("draw.js")
    events_js = read_file("events.js")

    html_code = html_code.replace('<link rel="stylesheet" href="style.css">', f'<style>{css_code}</style>')
    html_code = html_code.replace('<script src="state.js"></script>', f'<script>{state_js}</script>')
    html_code = html_code.replace('<script src="draw.js"></script>', f'<script>{draw_js}</script>')
    html_code = html_code.replace('<script src="events.js"></script>', f'<script>{events_js}</script>')

    return components.html(html_code, width=720, height=470, scrolling=False)
