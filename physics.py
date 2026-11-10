import numpy as np

# Фізичні константи лабораторної установки (за методичними вказівками до ЛР №3)
U_SOURCE = 16.0       # Напруга знижувального трансформатора (В)
R_FLAT = 5.0          # Відстань між пластинами плоского конденсатора (см)
R1_CYL = 2.5          # Радіус внутрішнього циліндричного електрода (см)
R2_CYL = 7.5          # Радіус зовнішнього циліндричного електрода (см)
K_CYL = U_SOURCE / np.log(R2_CYL / R1_CYL)  # Постійна k ≈ 14.57 В (формула 3.20)


def has_wire(wires, t1, t2):
    """Перевіряє, чи з'єднав студент клему t1 з клемою t2."""
    if not wires:
        return False
    for w in wires:
        fid = w["from"]["id"]
        tid = w["to"]["id"]
        if (fid == t1 and tid == t2) or (fid == t2 and tid == t1):
            return True
    return False


def check_wheatstone_bridge(wires):
    """
    Перевіряє правильність складання схеми містка Уїтстона за Рис. 3.4:
    1. Електроди ванни (1 та 2) підключені до джерела ~16 В.
    2. Крайні клеми потенціометра (4) підключені до джерела ~16 В.
    3. Осцилограф (5) увімкнений у діагональ містка (між зондом 3 та повзунком потенціометра 4).
    4. Вольтметр (V) вимірює різницю потенціалів між електродом 2 (0 В) та повзунком потенціометра.
    """
    bath_powered = (
        has_wire(wires, "src_left", "el_2") and
        has_wire(wires, "src_right", "el_1")
    )
    pot_powered = (
        has_wire(wires, "src_left", "pot_left") and
        has_wire(wires, "src_right", "pot_right")
    )
    osc_connected = (
        (has_wire(wires, "probe", "osc_1") and has_wire(wires, "pot_wiper", "osc_2")) or
        (has_wire(wires, "probe", "osc_2") and has_wire(wires, "pot_wiper", "osc_1"))
    )
    volt_connected = (
        (has_wire(wires, "el_2", "volt_1") and has_wire(wires, "pot_wiper", "volt_2")) or
        (has_wire(wires, "pot_left", "volt_1") and has_wire(wires, "pot_wiper", "volt_2"))
    )
    return bath_powered and pot_powered and osc_connected and volt_connected


def calc_flat_potential(x_cm):
    """Теоретичний розподіл потенціалу для плоского конденсатора (формула 3.18)."""
    x_clamped = np.clip(x_cm, 0.0, R_FLAT)
    return (U_SOURCE / R_FLAT) * x_clamped


def calc_cyl_potential(x_cm):
    """
    Теоретичний розподіл потенціалу для циліндричного конденсатора (формула 3.19):
    x — відстань від внутрішнього електрода R1 до вимірюваної точки (від 0 до 5.0 см).
    """
    x_clamped = np.clip(x_cm, 0.0, R2_CYL - R1_CYL)
    return K_CYL * np.log((x_clamped + R1_CYL) / R1_CYL)
