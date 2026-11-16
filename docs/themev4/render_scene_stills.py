"""Render two comparable Theme V4 composition stills. No runtime UI is changed."""

from pathlib import Path
from xml.sax.saxutils import escape


OUT = Path(__file__).absolute().parent

SCENES = {
    "sakura": {
        "name": "樱花寿司屋",
        "sky_top": "#f7d6c8",
        "sky_bottom": "#f6e7d5",
        "wall": "#f9ebdc",
        "wall_dark": "#dcb99a",
        "trim": "#9f6c58",
        "trim_light": "#c58b70",
        "stage": "#f8eadf",
        "stage_front": "#bd8068",
        "stage_shadow": "#85584a",
        "accent": "#d98398",
        "accent_soft": "#f2bdca",
        "ink": "#513d39",
        "dish_bg": "#fff8f0",
        "window": '''<path d="M0 304 Q1100 285 1920 306 T3840 302 V360 H0Z" fill="#c9b99e" opacity=".48"/>
        <path d="M0 238 C260 246 360 294 530 318 M3840 232 C3550 250 3470 300 3295 326" fill="none" stroke="#916459" stroke-width="31" stroke-linecap="round"/>
        <g fill="#e7a2b1" opacity=".94"><circle cx="146" cy="240" r="27"/><circle cx="236" cy="264" r="21"/><circle cx="341" cy="291" r="26"/><circle cx="3711" cy="242" r="26"/><circle cx="3594" cy="277" r="23"/><circle cx="3495" cy="302" r="19"/></g>
        <g fill="#fff1eb" opacity=".9"><circle cx="192" cy="257" r="11"/><circle cx="295" cy="283" r="10"/><circle cx="3660" cy="256" r="11"/></g>''',
        "edge": '''<path d="M0 285 V760 H244 V312" fill="#bb8b73" opacity=".58"/>
        <path d="M3840 285 V760 H3596 V312" fill="#bb8b73" opacity=".58"/>
        <path d="M50 375 H200 M50 505 H200 M3640 375 H3790 M3640 505 H3790" stroke="#855f50" stroke-width="16" stroke-linecap="round"/>
        <path d="M98 338 V401 M3740 338 V401" stroke="#65453d" stroke-width="8"/>
        <ellipse cx="98" cy="426" rx="40" ry="59" fill="#d87e74"/><ellipse cx="3740" cy="426" rx="40" ry="59" fill="#d87e74"/>
        <path d="M65 415 H131 M3707 415 H3773" stroke="#f9ddbd" stroke-width="7"/>''',
        "subtitle": "春日窗景 · 木屋檐 · 暖灯笼",
    },
    "coast": {
        "name": "海边寿司屋",
        "sky_top": "#b7e6e8",
        "sky_bottom": "#f1efd8",
        "wall": "#e9eee5",
        "wall_dark": "#b9d1c8",
        "trim": "#5a8d91",
        "trim_light": "#79b7b4",
        "stage": "#e8f2ed",
        "stage_front": "#70a9ab",
        "stage_shadow": "#4f7c82",
        "accent": "#e9ad72",
        "accent_soft": "#f1d39e",
        "ink": "#29494e",
        "dish_bg": "#f9fcf6",
        "window": '''<path d="M0 308 Q960 298 1920 312 T3840 310 V360 H0Z" fill="#70bdc2" opacity=".65"/>
        <path d="M0 327 Q800 316 1530 331 T2860 327 T3840 331" fill="none" stroke="#f7fff8" stroke-width="9" opacity=".75"/>
        <circle cx="3260" cy="253" r="62" fill="#f7d28f" opacity=".9"/>
        <path d="M0 223 H3840" stroke="#d5e4d5" stroke-width="12" opacity=".7"/>''',
        "edge": '''<path d="M0 285 V760 H244 V312" fill="#83b7af" opacity=".52"/>
        <path d="M3840 285 V760 H3596 V312" fill="#83b7af" opacity=".52"/>
        <path d="M15 347 Q120 299 226 347 L205 370 H36Z M3614 347 Q3720 299 3825 347 L3804 370 H3636Z" fill="#f3d6a2" stroke="#548e90" stroke-width="12"/>
        <path d="M120 370 V680 M3720 370 V680" stroke="#578e8d" stroke-width="13"/>
        <path d="M28 635 Q80 620 132 635 T238 635 M3602 635 Q3654 620 3706 635 T3812 635" fill="none" stroke="#e2f7ee" stroke-width="12" opacity=".72"/>''',
        "subtitle": "海平线 · 遮阳棚 · 少量海浪",
    },
}


def cat(cx: int, colors: dict) -> str:
    return f'''<g transform="translate({cx} 266)">
      <path d="M-75 70 Q-95 31 -58 15 L-49 45 Q0 18 49 45 L58 15 Q95 31 75 70 Q65 128 0 131 Q-65 128 -75 70Z" fill="#f4e6d0" stroke="{colors['ink']}" stroke-width="8"/>
      <ellipse cx="-27" cy="76" rx="7" ry="10" fill="{colors['ink']}"/><ellipse cx="27" cy="76" rx="7" ry="10" fill="{colors['ink']}"/>
      <path d="M-8 98 Q0 106 8 98" fill="none" stroke="{colors['ink']}" stroke-width="6" stroke-linecap="round"/>
      <path d="M-67 133 Q0 113 67 133 L84 167 H-84Z" fill="{colors['accent_soft']}" stroke="{colors['ink']}" stroke-width="7"/>
    </g>'''


def dish(cx: int, label: str, price: str, fill: str, colors: dict) -> str:
    return f'''<g transform="translate({cx} 556)">
      <ellipse cy="116" rx="190" ry="31" fill="{colors['stage_shadow']}" opacity=".22"/>
      <rect x="-178" y="-118" width="356" height="242" rx="38" fill="{colors['dish_bg']}" stroke="{colors['trim']}" stroke-width="8"/>
      <ellipse cy="-29" rx="132" ry="67" fill="#fffdf9" stroke="{colors['trim_light']}" stroke-width="8"/>
      <path d="M-81 -28 Q-74 -78 -22 -66 Q10 -55 5 -18 Q-17 9 -65 3Z M23 -19 Q29 -68 75 -62 Q112 -45 94 -5 Q72 13 33 7Z" fill="{fill}" stroke="{colors['ink']}" stroke-width="5"/>
      <text y="79" text-anchor="middle" font-size="31" font-weight="700" fill="{colors['ink']}">{escape(label)} · ¥{escape(price)}</text>
    </g>'''


def render(key: str, colors: dict) -> str:
    cats = "".join(cat(x, colors) for x in (560, 1920, 3280))
    dishes = "".join((
        dish(745, "三文鱼握寿司", "22", "#e99172", colors),
        dish(1535, "炙烤鳗鱼", "28", "#b67a4f", colors),
        dish(2325, "玉子烧", "18", "#edc86e", colors),
        dish(3095, "鲜虾寿司", "24", "#e2a092", colors),
    ))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3840 1080" role="img" aria-labelledby="title desc">
  <title id="title">Theme V4 {colors['name']}静帧构图</title>
  <desc id="desc">共用三只猫与送餐台位置。{colors['subtitle']}用于快速识别主题，菜品与操作区清晰可见。</desc>
  <defs>
    <linearGradient id="sky" x2="0" y2="1"><stop stop-color="{colors['sky_top']}"/><stop offset="1" stop-color="{colors['sky_bottom']}"/></linearGradient>
    <linearGradient id="table" x2="0" y2="1"><stop stop-color="{colors['stage']}"/><stop offset="1" stop-color="{colors['stage_front']}"/></linearGradient>
    <filter id="shadow" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="13" stdDeviation="14" flood-color="{colors['stage_shadow']}" flood-opacity=".2"/></filter>
  </defs>
  <rect width="3840" height="1080" fill="{colors['wall']}"/>
  <rect x="0" y="200" width="3840" height="160" fill="url(#sky)"/>
  {colors['window']}
  <path d="M0 185 H3840 M0 360 H3840" stroke="{colors['trim']}" stroke-width="19"/>
  <path d="M0 189 H3840" stroke="{colors['trim_light']}" stroke-width="8"/>
  {colors['edge']}
  <g>{cats}</g>
  <rect x="265" y="355" width="3310" height="395" rx="73" fill="{colors['stage_shadow']}" opacity=".25"/>
  <rect x="280" y="381" width="3280" height="390" rx="65" fill="url(#table)" stroke="{colors['trim']}" stroke-width="19" filter="url(#shadow)"/>
  <path d="M340 487 Q1920 396 3500 487" fill="none" stroke="{colors['trim_light']}" stroke-width="24" stroke-linecap="round"/>
  <path d="M340 696 Q1920 621 3500 696" fill="none" stroke="{colors['stage_shadow']}" stroke-width="23" stroke-linecap="round" opacity=".75"/>
  <path d="M355 723 Q1920 645 3485 723" fill="none" stroke="#fff8ec" stroke-width="7" stroke-linecap="round" opacity=".65"/>
  <g>{dishes}</g>
  <rect x="235" y="733" width="3370" height="59" rx="27" fill="{colors['stage_front']}" stroke="{colors['trim']}" stroke-width="13"/>
  <path d="M307 758 H3533" stroke="{colors['accent_soft']}" stroke-width="7" opacity=".65"/>
  <rect y="865" width="3840" height="215" fill="{colors['wall_dark']}" opacity=".58"/>
  <g fill="{colors['dish_bg']}" stroke="{colors['trim']}" stroke-width="9">
    <rect x="668" y="881" width="827" height="183" rx="47"/>
    <rect x="1525" y="881" width="790" height="183" rx="47"/>
    <rect x="2345" y="881" width="827" height="183" rx="47"/>
  </g>
  <g fill="{colors['accent_soft']}" stroke="{colors['trim']}" stroke-width="6">
    <circle cx="825" cy="969" r="50"/><circle cx="990" cy="969" r="50"/><circle cx="1155" cy="969" r="50"/><circle cx="1320" cy="969" r="50"/>
    <circle cx="2500" cy="969" r="50"/><circle cx="2665" cy="969" r="50"/><circle cx="2830" cy="969" r="50"/><circle cx="2995" cy="969" r="50"/>
  </g>
  <g fill="{colors['trim_light']}"><rect x="1582" y="909" width="135" height="120" rx="27"/><rect x="1752" y="909" width="135" height="120" rx="27"/><rect x="1922" y="909" width="135" height="120" rx="27"/><rect x="2092" y="909" width="135" height="120" rx="27"/></g>
  <g font-family="Microsoft YaHei,Noto Sans CJK SC,sans-serif" fill="{colors['ink']}">
    <text x="82" y="101" font-size="62" font-weight="800">三禾 · 点餐</text>
    <text x="91" y="149" font-size="27">TABLE Y1 · 2 SEATS</text>
    <text x="1630" y="97" font-size="41" font-weight="700">投碟进度</text>
    <text x="3264" y="99" font-size="36" font-weight="700">小禾助手</text>
  </g>
  <g font-family="Microsoft YaHei,Noto Sans CJK SC,sans-serif" fill="#fffdf7" font-size="28" font-weight="700" text-anchor="middle">
    <text x="1650" y="979">菜单</text><text x="1820" y="979">导航</text>
    <text x="1990" y="979">记录</text><text x="2160" y="979">设置</text>
  </g>
  <path d="M1570 134 H2270" stroke="{colors['trim']}" stroke-width="19" stroke-linecap="round"/>
  <path d="M1570 134 H1890" stroke="{colors['accent']}" stroke-width="19" stroke-linecap="round"/>
  <rect x="3714" y="35" width="87" height="78" rx="18" fill="{colors['accent_soft']}"/>
</svg>'''


for scene_key, scene in SCENES.items():
    path = OUT / f"02-{scene_key}-still.svg"
    path.write_text(render(scene_key, scene), encoding="utf-8")
    print(path)
