# NEXORA — материалы

## AI-архитектура

`public/media/property-01.webp` … `property-12.webp` созданы встроенным инструментом OpenAI image generation специально для этой демонстрации. Каждый файл — контактный лист 2×2 с четырьмя отдельными согласованными ракурсами одного вымышленного объекта: общий вид, гостиная, спальня, терраса/внешнее пространство. Компонент `PhotoView` отображает отдельный кадр через CSS, не загружая четыре копии файла. Исходный размер листа 1536×1024, WebP, около 0.3–0.45 МБ. Для печати или настоящих объявлений нужны отдельные полноразмерные оригиналы и реальные фотографии объекта.

Темы генерации:

| Файл | Концепция |
|---|---|
| 01 | The Obsidian Residence, Dubai: тёмный камень, стекло, вилла у воды |
| 02 | Palm Horizon, Dubai: известняк и просторные морские террасы |
| 03 | The Sky Atelier, Dubai: высотные апартаменты с панорамой |
| 04 | Desert Courtyard, Dubai: особняк с внутренним двором |
| 05 | Riviera Épure, Monaco: средиземноморская вилла на склоне |
| 06 | Monte Carlo Light, Monaco: светлые апартаменты у Ривьеры |
| 07 | Cap Serenité, Monaco: резиденция и терраса у моря |
| 08 | The Manhattan Frame, New York: панорамные городские апартаменты |
| 09 | West Village House, New York: городской особняк |
| 10 | Kanso Residence, Tokyo: дерево, бетон и внутренний сад |
| 11 | Tokyo Afterglow, Tokyo: спокойные апартаменты над городом |
| 12 | Biscayne House, Miami: светлая резиденция, бассейн, тропический сад |

Это описание использованного набора концепций, а не дословный журнал промптов. AI-изображения не являются документальными снимками и не подтверждают существование или продажу реальной недвижимости.

## Лицензированная фотография

- `dubai-skyline.jpg`: [Sirav Talwar — Dubai's skyline featuring the Burj Khalifa](https://unsplash.com/photos/dubais-skyline-featuring-the-burj-khalifa-lMo2HjtoUpM), опубликовано 27 апреля 2025, [Unsplash License](https://unsplash.com/license). Локальная оптимизированная копия 1600 px. Используется для города и страницы о концепции, не выдается за объект объявления.

## Земля и карта

- `earth-texture.jpg`: NASA Blue Marble, копия из [three-globe examples](https://github.com/vasturiano/three-globe/blob/master/example/img/earth-blue-marble.jpg). [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
- `globe-fallback.webp`, `globe-fallback.webm`: локальный рендер сцены NEXORA на этой текстуре. Видео — запасной вариант для настольных устройств без WebGL; на телефонах используется изображение.
- Данные и тайлы карты: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Атрибуция видна на каждой карте; [политика тайлов](https://operations.osmfoundation.org/policies/tiles/).

## Шрифты и иконки

- Space Grotesk и Manrope: SIL Open Font License, доставлены пакетами Fontsource, хранятся локально после сборки.
- Lucide React: ISC license.
- Знак NEXORA — простой геометрический SVG, созданный для демонстрации.
