import streamlit as st
import pandas as pd
from canvas_bench import interactive_bench

st.set_page_config(page_title="Віртуальна ЛР №3: Дослідження електричного поля", layout="wide")
st.title("⚡ Віртуальна лабораторна робота № 3")
st.subheader("«Дослідження електричного поля»")

# Ініціалізація сесії для таблиць експерименту
if "data_flat" not in st.session_state:
    st.session_state.data_flat = pd.DataFrame(columns=["x (см)", "φ_екс (В)"])
if "data_cyl" not in st.session_state:
    st.session_state.data_cyl = pd.DataFrame(columns=["x (см)", "φ_екс (В)"])

# Створення вкладок для двох етапів ЛР
tab1, tab2 = st.tabs([
    "📏 1. Плоский конденсатор (r = 5,0 см)",
    "⭕ 2. Циліндричний конденсатор (R₁ = 2,5 см, R₂ = 7,5 см)"
])

# ==========================================
# ВКЛАДКА 1: Плоский конденсатор
# ==========================================
with tab1:
    st.markdown("### Дослідження розподілу потенціалу в полі плоского конденсатора (Рис. 3.4)")
    st.info(
        "🔌 **Порядок роботи:** Зберіть схему містка Уїтстона (з'єднайте клеми дротами). "
        "Переміщуйте зонд між електродами з кроком **0,5 см**, обертайте ручку потенціометра 4 "
        "(можна підлаштовувати стрілками **← / →** після кліку на стенд), доки вертикальна лінія на екрані "
        "осцилографа 5 не стягнеться у точку. Зніміть значення потенціалу з вольтметра **V**."
    )

    col1, col2 = st.columns([4.0, 1], gap="medium")
    with col1:
        interactive_bench("stage1", key="bench_flat")

    with col2:
        st.markdown("#### 📟 Протокол вимірювань")

        x_in_flat = st.number_input(
            "Координата x (см)",
            min_value=0.0,
            max_value=5.0,
            step=0.5,
            format="%.1f",
            key="x_in_flat"
        )
        phi_in_flat = st.number_input(
            "Потенціал φ_екс (В)",
            min_value=0.0,
            max_value=16.5,
            step=0.01,
            format="%.2f",
            key="phi_in_flat"
        )

        if st.button("📥 Записати точку в таблицю", key="btn_add_flat", use_container_width=True):
            new_row = pd.DataFrame([{"x (см)": round(x_in_flat, 1), "φ_екс (В)": round(phi_in_flat, 2)}])
            st.session_state.data_flat = pd.concat([st.session_state.data_flat, new_row], ignore_index=True)
            st.rerun()

        if st.button("🧹 Очистити таблицю етапу 1", key="clear_flat", use_container_width=True):
            st.session_state.data_flat = pd.DataFrame(columns=["x (см)", "φ_екс (В)"])
            st.rerun()

        st.dataframe(st.session_state.data_flat, use_container_width=True, height=230)

# ==========================================
# ВКЛАДКА 2: Циліндричний конденсатор
# ==========================================
with tab2:
    st.markdown("### Дослідження розподілу потенціалу в полі циліндричного конденсатора")
    st.info(
        "🔌 **Порядок роботи:** Зберіть схему за Рис. 3.4 (внутрішній циліндричний електрод R₁ = 2,5 см "
        "підключіть до правої клеми джерела ~16 В, зовнішній R₂ = 7,5 см — до лівої). "
        "Змінюйте відстань **x** від внутрішнього електрода до зонда через **0,5 см**, "
        "балансуйте місток потенціометром 4 за осцилографом 5 та фіксуйте покази вольтметра **V**."
    )

    col1, col2 = st.columns([3.1, 1], gap="medium")
    with col1:
        interactive_bench("stage2", key="bench_cyl")

    with col2:
        st.markdown("#### 📟 Протокол вимірювань")

        x_in_cyl = st.number_input(
            "Відстань x (см)",
            min_value=0.0,
            max_value=5.0,
            step=0.5,
            format="%.1f",
            key="x_in_cyl"
        )
        phi_in_cyl = st.number_input(
            "Потенціал φ_екс (В)",
            min_value=0.0,
            max_value=16.5,
            step=0.01,
            format="%.2f",
            key="phi_in_cyl"
        )

        if st.button("📥 Записати точку в таблицю", key="btn_add_cyl", use_container_width=True):
            new_row = pd.DataFrame([{"x (см)": round(x_in_cyl, 1), "φ_екс (В)": round(phi_in_cyl, 2)}])
            st.session_state.data_cyl = pd.concat([st.session_state.data_cyl, new_row], ignore_index=True)
            st.rerun()

        if st.button("🧹 Очистити таблицю етапу 2", key="clear_cyl", use_container_width=True):
            st.session_state.data_cyl = pd.DataFrame(columns=["x (см)", "φ_екс (В)"])
            st.rerun()

        st.dataframe(st.session_state.data_cyl, use_container_width=True, height=230)
