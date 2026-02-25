import React, { useRef, useState, useMemo } from 'react';
import { Pencil, Brush, Square, Circle as CircleIcon, Triangle, Star, Copy, Scissors, Play, Pause, Square as SquareIcon, Magnet, LayoutGrid, Undo2, Redo2, Trash2, Type, MousePointerClick } from 'lucide-react';
import useDraw from './hooks/useDraw';
import Canvas from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { smoothPath, applySymmetry, parseSVGToPaths } from './utils/geometry';
import { cn } from './utils/cn';
import { CodePanel } from './components/CodePanel';
import { LayerPanel } from './components/LayerPanel';
import Timeline from './components/Timeline';
import { SVG_DEF_MAP } from './utils/svgDefs';
import { X } from 'lucide-react';

const CHANGELOG = [
  { version: 'v26.0225.1010', date: '2026-02-25', items: ['简化编辑体验：取消包围盒与变换手柄的 CSS 预设动画跟随，使其在图形执行旋转、跳动等动画时保持静止，避免视觉干扰与操作漂移'] },
  { version: 'v26.0225.0945', date: '2026-02-25', items: ['彻底解决旋转不同步：统一图形与控制框的动态轴心坐标，消除因关键帧偏移、双重动画叠加导致的包围盒与图形实时渲染错位问题'] },
  { version: 'v26.0225.0935', date: '2026-02-25', items: ['完美同步包围盒：修复取消选择后重选导致的控制框滞后/跳变问题，通过统一图形与手柄的动画基准点（Stable Center），确保交互反馈毫无延迟'] },
  { version: 'v26.0225.0950', date: '2026-02-25', items: ['深度同步动画与包围盒：引入稳定中心点参考机制，彻底解决在编辑模式下切换选中状态时，预设动画（旋转、跳动等）参考坐标突变导致的包围盒与图形脱节问题'] },
  { version: 'v26.0225.0930', date: '2026-02-25', items: ['紧急修复手柄失效问题：将 ID 标识重新绑定至交互热区元素，解决上一版本优化导致的变换手柄无法选中的回归 Bug'] },
  { version: 'v26.0225.0925', date: '2026-02-25', items: ['精准对齐变换手柄：修复旋转与缩放手柄的视觉偏移问题，确保点击判定点与图标位置完美重合，并增大盲选判定范围'] },
  { version: 'v26.0225.0910', date: '2026-02-25', items: ['修复编辑模式变换手柄：统一鼠标点击与变换轴心的坐标空间，解决缩放或位移后旋转/等比缩动手柄失效的问题'] },
  { version: 'v26.0225.0900', date: '2026-02-25', items: ['合并/拆分逻辑增强：合并图层或拆分图层时，完美保留子图形的独立中心点（Pivot）及关键帧动画，确保图层结构变化不影响既有动画表现'] },
  { version: 'v26.0225.0055', date: '2026-02-25', items: ['深度同步包围盒与动画：将预设动画（旋转、弹跳等）的变换坐标系统一至 SVG 绝对坐标空间，彻底解决动画过程中包围盒与图形位移不同步、中心点偏移的问题'] },
  { version: 'v26.0225.0040', date: '2026-02-25', items: ['优化 Pivot Point 交互体验：修复拖拽中心点时不跟随鼠标的偏移问题及缩放补偿，增大点击判定范围并使装饰图标忽略点击，提升精准度与易用性'] },
  { version: 'v26.0225.0020', date: '2026-02-25', items: ['根本修复 Pivot Point 旋转中心偏差问题：弃用 fill-box 相对坐标，改用 SVG viewBox 绝对坐标精准锚定旋转轴位置，确保瞄准镜所在位置与实际旋转中心完全重合'] },
  { version: 'v26.0225.0005', date: '2026-02-25', items: ['新增“自定义变换中心（Pivot Point）”功能：在编辑模式下可自由拖拽各图层（及合并图层子图案）的旋转/缩放中心', '适配关键帧动画：Pivot 偏移量支持随时间轴记录并插值，实现更复杂的动力学表现', '导出优化：生成的 SVG 代码完美保留自定义 Pivot 属性，确保在任意浏览器中动画表现与编辑器一致'] },
  { version: 'v26.0224.2230', date: '2026-02-24', items: ['修复导出 SVG 在 Chrome 中 Hover 效果导致 3D 滤镜失效的问题：通过 <g> 标签隔离交互样式，确保立体感与交互反馈完美共存'] },
  { version: 'v26.0224.2215', date: '2026-02-24', items: ['新增“可交互 UI”开关：支持为 SVG 图形一键添加 Hover（悬停）与 Click（点击）反馈效果，生成可直接交互的 UI 组件'] },
  { version: 'v26.0224.2201', date: '2026-02-24', items: ['支持“预设风格绘制”：在绘制模式下选中风格后，新画出的图形将直接应用该风格，无需事后修改'] },
  { version: 'v26.0224.2155', date: '2026-02-24', items: ['修复 SVG 导出时滤镜丢失的问题；优化滤镜光照坐标系，确保立体效果在任意位置均能正确显现'] },
  { version: 'v26.0224.2148', date: '2026-02-24', items: ['深度优化 UI 风格库：新增“高级 3D 倒角”与“软质塑料”立体效果，通过 Specular Lighting 模拟真实高光与阴影显现体积感'] },
  { version: 'v26.0224.1735', date: '2026-02-24', items: ['新增 UI 风格库（Style Library），支持一键应用玻璃拟态、新拟态、黏土拟态、霓虹等流行 UI 视觉效果'] },
  { version: 'v26.0224.1656', date: '2026-02-24', items: ['修复导出 SVG 或复制代码时，合并图层内部子图形的关键帧动画和静态变换丢失的问题'] },
  { version: 'v26.0224.1646', date: '2026-02-24', items: ['修复单个图层有动画时合并后动画被错误应用到整体合并图层的问题；合并时所有 CSS 动画被重置，避免双重应用'] },
  { version: 'v26.0222.1750', date: '2026-02-22', items: ['修复合并图层批量修改颜色属性的逻辑问题'] },
  {
    version: 'v26.0224.1110',
    date: '2026-02-24',
    items: [
      '实现合并图层动画双层独立控制：整体动画和子图案独立动画现在完全互不干扰，可同时共存',
      '示例：全选图层设置 spin 旋转，再单选子图案设置 pulse 闪烁 —— 整体旋转的同时，该子图案还会独立闪烁'
    ]
  },
  {
    version: 'v26.0224.1103',
    date: '2026-02-24',
    items: [
      '修复合并图层全选模式下动画叠加的问题：全选模式下设置动画（如旋转）现在只在整体层级应用，不会同时复制到每个子图案产生重复旋转',
      '优化动画层级逻辑：整体动画通过外层包裹实现，子图案独立动画仅在局部单选时设置，互不干扰'
    ]
  },
  {
    version: 'v26.0224.1058',
    date: '2026-02-24',
    items: [
      '支持合并图层子图案独立动画：在局部单选模式下设置动画只会应用于当前聚焦的子图案，而不会影响其它子图案或整体动画',
      '优化整体动画设置：在全选模式下，动画变更将统一同步到所有子图案，保持视觉一致性'
    ]
  },
  {
    version: 'v26.0224.1045',
    date: '2026-02-24',
    items: [
      '修复合并图层非选中子图案仍显示顶点的问题：统一两处顶点渲染分支（有动画/无动画）的过滤逻辑，确保只显示当前局部单选图案的顶点',
      '提升视觉清晰度：整体选中合并图层时不再展示大量重叠的顶点手柄，避免视觉干扰'
    ]
  },
  {
    version: 'v26.0224.1030',
    date: '2026-02-24',
    items: [
      '优化图层编辑功能：限制“双击添加顶点”仅在“顶点选择开关”开启时生效，防止在基础编辑模式下产生误操作',
      '提升交互逻辑一致性：确保只有在用户明确意图编辑形状锚点时，才响应路径上的加点操作'
    ]
  },
  {
    version: 'v26.0224.1020',
    date: '2026-02-24',
    items: [
      '优化顶点编辑交互：调整顶点锚点后，系统将自动保持当前的局部单选状态，不再跳转回图层全选模式',
      '增强操作连续性：确保在单选模式下进行多轮顶点微调时，无需重复双击进入局部模式'
    ]
  },
  {
    version: 'v26.0224.1026',
    date: '2026-02-24',
    items: [
      '修复合并图层局部编辑顶点失效的问题：优化事件处理优先级，确保在单选模式（Focus Mode）下锁定交互时，顶点手柄点击依然被正确优先识别',
      '提升顶点编辑兼容性：统一了顶点命中检测的坐标计算逻辑，修复了在锁定区域内无法拖拽锚点的 Bug'
    ]
  },
  {
    version: 'v26.0223.2320',
    date: '2026-02-23',
    items: [
      '修复顶点选择模式自动关闭的问题：通过修正事件处理函数的闭包依赖项（Stale Closure），确保顶点命中检测能始终识别最新状态',
      '增强手动控制稳定性：移除了路径选择、框选及双击操作时的自动重置逻辑，顶点选择开关现在完全由用户手动掌控，不会因画布点击而意外退出'
    ]
  },
  {
    version: 'v26.0222.1802',
    date: '2026-02-22',
    items: [
      '优化合并图层交互：在整体选择合并图层时，支持同步更改所有内部 sub-paths 的填充、描边、线宽、张力及动画属性',
      '修复合并图层属性隔离问题：确保整体样式调整能穿透到所有 segments，提供更直观的批量编辑体验'
    ]
  },
  {
    version: 'v26.0222.1746',
    date: '2026-02-22',
    items: [
      '优化关键帧动画导出逻辑：SVG 导出时长现在自动按最后一个关键帧的时间计算',
      '优化循环播放体验：动画播放到最后一个关键帧位置时自动重新开始，实现精准循环',
      '优化时间轴交互：时间轴视图至少展示 5s 长度，并随关键帧自动扩展，确保编辑空间充足'
    ]
  },
  {
    version: 'v26.0222.1715',
    date: '2026-02-22',
    items: [
      '彻底移除二次点击进入局部单选的功能：无论单击多少次，均仅选中图层整体，确保移动操作更加稳健',
      '规范局部选中触发：仅允许通过双击操作进入合并图层的内部子图案编辑模式（局部模式）',
      '优化图层操作逻辑：解决了点击已选中图层内部时可能产生的意外聚焦问题'
    ]
  },
  {
    version: 'v26.0222.1712',
    date: '2026-02-22',
    items: [
      '优化合并图层交互逻辑：恢复“先选中整体、再次点击选中局部”的层次感，避免首次点击就进入单选模式导致的误操作',
      '修复合并图层选择 Bug：确保在未选中状态下点击合并图层时，默认显示图层整体边界及其全部子路径预览',
      '保留双击快捷操作：双击合并图层子路径仍可直接跳过整体选择，快速定位并聚焦目标局部图层'
    ]
  },
  {
    version: 'v26.0222.1651',
    date: '2026-02-22',
    items: [
      '新增绘图区背景颜色选择器：支持透明（棋盘格）、白色、深灰、黑色快速切换，方便在不同环境下构图',
      '优化对称轴视觉反馈：根据背景色自动调整对称轴及中心点对比度，确保在浅色背景下依然清晰可见',
      '改进 Canvas 渲染层：支持棋盘格纹理背景，适配专业绘图软件操作习惯'
    ]
  },
  {
    version: 'v26.0222.1646',
    date: '2026-02-22',
    items: [
      '优化工具栏文件操作布局：将 Save SVG 与 Load SVG（原 Import）并排排列，节省垂直空间',
      '统一功能命名策略：更直观的 Save/Load 术语替代原有的 Download/Import',
      '微调 JSON 操作按钮样式：弱化二级操作层级，使核心 SVG 功能更突出'
    ]
  },
  {
    version: 'v26.0222.1642',
    date: '2026-02-22',
    items: [
      '工具栏新增“Import SVG”功能：支持直接将外部 SVG 图标导入画布进行编辑，自动解析路径、颜色及基础变形属性',
      '优化文件管理：在导出区域底部集成导入按钮，统一管理原生 JSON 载入与外部 SVG 导入'
    ]
  },
  {
    version: 'v26.0222.1635',
    date: '2026-02-22',
    items: [
      '彻底修复复杂 SVG（如带孔图标）合并图层后的动画编辑问题：优化子图案选中逻辑（segmentGroupings），确保双击或单击时能完整选中包含“孔洞”的复合路径',
      '修复导入 SVG 合并后默认动画参数 Bug：将默认动画时长 from 0s 修正为 2s，确保添加动画类型后能立即生效并可见',
      '增强单选模式交互：支持在非顶点编辑状态下通过单击快速切换合并图层中的子图案选中目标'
    ]
  },
  {
    version: 'v26.0222.1818',
    date: '2026-02-22',
    items: [
      '彻底修复带动画SVG导出后的全黑与孔洞失效问题：重构导出层的分组逻辑（segmentGroupings），确保合并图层中的复合路径在包含独立动画时仍能正确维持“孔洞”裁剪效果',
      '优化动画导出兼容性：确保导出的SVG在不同浏览器下均能保持正确的填充色与描边透明度'
    ]
  },
  {
    version: 'v26.0222.1620',
    date: '2026-02-22',
    items: [
      '修复SVG导入/导出颜色丢失问题：优化属性解析算法，支持从根节点继承颜色属性，解决部分图标导入后变为全黑的Bug',
      '修复导出时复合路径（Compound Path）孔洞失效问题：调整导出逻辑，确保原始SVG的嵌套路径在导出时保持完整，不再错误地拆分为独立实心色块'
    ]
  },
  {
    version: 'v26.0222.1555',
    date: '2026-02-22',
    items: [
      '优化编辑模式渲染策略：取消选中图形自动置顶的逻辑，确保图层在编辑时依然保持其原始的层级深度，避免遮挡其它关键元素'
    ]
  },
  {
    version: 'v26.0222.1550',
    date: '2026-02-22',
    items: [
      '锁定单选交互模式：在聚焦合并图层的子图案时，画布交互将被“锁定”，点击空白处或其它图形不会退出当前选中状态',
      '强制操作流引导：退出子图案单选模式现在只能通过在图层面板中点击该合并图层的根节点实现，防止由于画布误触导致编辑中断'
    ]
  },
  {
    version: 'v26.0222.1545',
    date: '2026-02-22',
    items: [
      '进一步优化单选交互：双击合并图层子图案进入单选专注模式时，也默认保持顶点编辑关闭，确保编辑视野清晰'
    ]
  },
  {
    version: 'v26.0221.1738',
    date: '2026-02-21',
    items: [
      '修复图层面板单选深度：合并图层现在支持精准单选内部某个特定图形',
      '视觉反馈优化：聚焦子图案时提供独立包围盒与控制手柄，背景图层自动半透明化突出显示编辑目标'
    ]
  },
  {
    version: 'v26.0221.1440',
    date: '2026-02-21',
    items: [
      '新增背景画布颜色选择器：位于左侧工具栏下方，支持自定义白、浅灰、深灰、黑及透明背景，提升不同色调SVG的编辑体验',
      '界面布局微调：优化左侧控制栏组件间距，使背景切换按钮与对称按钮视觉统一'
    ]
  },
  {
    version: 'v26.0221.0850',
    date: '2026-02-21',
    items: [
      '优化导出图层命名逻辑：导出SVG时自动使用面板中的图层名称作为元素ID，提升生产环境代码的可读性',
      '修复图层预览生成Bug：确保各图层预览图标能正确反映最新的路径修改'
    ]
  },
  {
    version: 'v26.0222.1555',
    date: '2026-02-22',
    items: [
      '优化单选模式交互：进入单选（Edit）模式或进行批量框选时，默认关闭顶点编辑，提供更清爽的视觉反馈',
      '保留顶点编辑触发机制：仅在双击具体子图案或手动切换时开启顶点模式，大幅降低误触概率'
    ]
  },
  {
    version: 'v26.0222.1550',
    date: '2026-02-22',
    items: [
      '彻底修复“合并图层”功能导致带有孔洞（复合路径）的SVG图形变成实心黑色的问题',
      '重构了合并图层的渲染与碰撞选择逻辑：现在合并后的子图案将基于原始图层节点联动，既保留了独立编辑与拖拽的功能，又完美保持了原生SVG的抠除剪裁（Clip/Winding Rule）样式'
    ]
  },
  {
    version: 'v26.0222.1531',
    date: '2026-02-22',
    items: [
      '修复导入包含孔洞（复合路径）的SVG文件在编辑模式下由于拆分渲染导致填充为实心黑色的问题',
      '优化渲染逻辑，在编辑模式下仅对合并图层进行子图案拆分渲染，完美保留合并图层的单选功能'
    ]
  },
  {
    version: 'v26.0222.1350',
    date: '2026-02-22',
    items: [
      '彻底解决退出单选与关闭锚点编辑的问题：通过在图层面板单击图层，强制退出单选模式并关闭锚点。',
      '修复在图层面板选择合并图层后，因局部状态未及时清理导致无法整体平移合并图层的问题。'
    ]
  },
  {
    version: 'v26.0222.1333',
    date: '2026-02-22',
    items: ['优化交互：在图层面板中再次点击（选中）图层项或切换图层时即可快速退出“顶点编辑”状态并恢复对其整体的控制']
  },
  {
    version: 'v26.0222.1332',
    date: '2026-02-22',
    items: ['优化交互：在编辑面版中再次点击（选中）图层项即可快速退出“顶点编辑”状态并恢复整体控制']
  },
  {
    version: 'v26.0222.1326',
    date: '2026-02-22',
    items: ['优化合并图层交互：在“顶点编辑”模式下单选了合并图层中的子图形后，点击图层空白处可快速退出单选模式并恢复对其整体的控制']
  },
  {
    version: 'v26.0222.1325',
    date: '2026-02-22',
    items: ['修复包含多条子路径的合并图层在编辑模式下只能选择/高亮第一条路径的Bug', '优化合并图层渲染机制：编辑模式下拆分渲染子路径以支持精确的独立DOM点击检测']
  },
  {
    version: 'v26.0222.1315',
    date: '2026-02-22',
    items: ['支持通过鼠标双击“合并图层”中的单个图案进行快速选择', '双击单个图案时，会自动开启“顶点编辑”模式，方便直接对子图形进行精准操作', '优化双击逻辑：支持在未选中的情况下直接双击选择并编辑图案']
  },
  {
    version: 'v26.0222.1250',
    date: '2026-02-22',
    items: ['修复多选图案时，单击拖拽会导致其他选区取消选中，无法同步平移的问题', '重构拖拽底层逻辑，改为基于初始引用（Ref）计算拖拽变更，彻底解决闭包旧状态引发的位移失败和状态丢失问题']
  },
  {
    version: 'v26.0222.1235',
    date: '2026-02-22',
    items: ['新增“顶点编辑”手动开关，位于复制/删除工具栏首位', '当“顶点编辑”开启时，才会显示并允许拖拽路径控制点，防止误触', '优化合并图层后的编辑体验，支持通过开关切换全局变换与局部点操作']
  },
  {
    version: 'v26.0222.1126',
    date: '2026-02-22',
    items: ['修复SVG导入时复合路径（Compound Path，镂空图形的负形空间）显示为纯黑实心的问题', '修复SVG导入时内联style属性中颜色丢失（变为纯黑）的问题', '修复带有transform属性的SVG路径在预览和编辑时的坐标偏移问题', '修复编辑模式下框选框不显示的问题', '修复编辑模式下框选功能无法正常结束并选中的问题', '编辑模式新增鼠标框选（Marquee Selection）功能']
  },
  {
    version: 'v26.0215.1825',
    date: '2026-02-15',
    items: ['新增绘图区顶点数实时统计显示，位于绘图区右上方', '优化 UI 布局，顶点数统计采用磨砂玻璃质感设计']
  },
  {
    version: 'v26.0225.1220',
    date: '2026-02-25',
    items: [
      '新增动画播放次数控制：每条动画可独立设置“循环播放 (Loop)”或“重复播放 (Repeat)”',
      '重复播放模式下可自定义播放次数（1-100次），播放完成后动画将停止在结束状态',
      '同步更新 Canvas 渲染引擎与 SVG 代码导出逻辑，支持 animation-iteration-count 属性'
    ]
  },
  {
    version: 'v26.0225.1210',
    date: '2026-02-25',
    items: [
      '重构动画面板：全新多动画 Slot 设计，支持最多9条独立动画',
      '每条动画独立拥有 duration、delay、ease、direction 参数',
      '点击 + 号弹出选择面板，选择动画类型后自动填入按 delay 排序的空位',
      '点击已填充 Slot 展开参数调节行，支持实时修改；修改 delay 后 slot 自动重新排序',
      'OFF 按钮：一键暂停所有动画（保留 entries 参数不丢失）',
      'AnimationSettings 数据结构完全重构：用 entries: AnimationEntry[] 替代原有 types[] + 共享参数',
      '同步更新 SVG 导出逻辑与 Canvas 渲染逻辑'
    ]
  },
  {
    version: 'v26.0215.1805',
    date: '2026-02-15',
    items: ['新增图层批量操作功能：多选图层后点击任意锁定、可见性或删除按钮即可应用至所有选中项', '图层面板新增“全选”与“取消全选”便捷按钮']
  },
  {
    version: 'v26.0215.1755',
    date: '2026-02-15',
    items: ['修复图层面板锁定按钮 ReferenceError: onToggleLock is not defined 运行时错误']
  },
  {
    version: 'v26.0215.1750',
    date: '2026-02-15',
    items: ['新增图层锁定功能：锁定后无法在画布中选中或操作，防止误触', '优化图层面板：操作按钮（锁定、可见性、删除）默认显示，不再需要悬停显示']
  },
  {
    version: 'v26.0215.1735',
    date: '2026-02-15',
    items: ['修正快捷键提示面板位置：从右上角移至左上角，彻底避开侧边操作按钮区域']
  },
  {
    version: 'v26.0215.1730',
    date: '2026-02-15',
    items: ['精简快捷键提示面板 UI：减小宽度、字体大小，并向左偏移以避开操作按钮', '优化面板布局，合并相似项，提升高密度 UI 下的可用性']
  },
  {
    version: 'v26.0215.1725',
    date: '2026-02-15',
    items: ['优化快捷键提示面板位置，从右下角移至右上角以避免遮挡清除按钮']
  },
  {
    version: 'v26.0215.1720',
    date: '2026-02-15',
    items: ['新增快捷键提示面板 (Quick Shortcuts)，支持手动关闭', '支持按 "?" 键快速显示或隐藏快捷键提示面板', '优化了 UI 布局，将提示面板置于画布右下角']
  },
  {
    version: 'v26.0215.1700',
    date: '2026-02-15',
    items: ['编辑模式支持按住 Shift 约束变换：平移约束至轴向，旋转约束至 15 度步进', '新增变换实时数据提示 (Tooltip)，显示位移、旋转角度及缩放比例', '重构变换逻辑为绝对坐标模型，消除累计误差并支持精确捕捉']
  },
  {
    version: 'v26.0215.1630', date: '2026-02-15', items: ['支持按住 Shift 键绘制正比例图形（正方形、正圆等）', '同步更新实时尺寸提示，支持 Shift 约束显示']
  },
  { version: 'v26.0215.1625', date: '2026-02-15', items: ['真正修复绘制图形时尺寸显示 tooltip 的 ReferenceError 错误（补全 App.tsx 中的解构）'] },
  { version: 'v26.0215.1620', date: '2026-02-15', items: ['彻底修复绘制图形时尺寸显示 tooltip 的 ReferenceError 错误（补齐 hook 返回值）'] },
  { version: 'v26.0215.1615', date: '2026-02-15', items: ['修复绘制图形时尺寸显示 tooltip 的 ReferenceError 错误'] },
  { version: 'v26.0215.1610', date: '2026-02-15', items: ['新增图形绘制实时尺寸显示 tooltip', '优化 Canvas 组件性能'] },
  { version: 'v26.0215.1600', date: '2026-02-15', items: ['深度压缩关键帧与动画面板：缩小字体、边距及轨道高度，最大化绘图区空间'] },
  { version: 'v26.0215.1545', date: '2026-02-15', items: ['界面布局优化：绘图区上移并缩小面板间距，提升垂直空间利用率'] },
  { version: 'v26.0215.1530', date: '2026-02-15', items: ['优化关键帧动画编辑的撤销/重做体验：将拖拽过程视为单一操作，避免产生大量冗余历史记录'] },
  { version: 'v26.0215.1515', date: '2026-02-15', items: ['优化关键帧初始化逻辑：开启 KeyFrame 模式时，自动为选中对象在 0 秒处创建初始关键帧'] },
  { version: 'v26.0215.1500', date: '2026-02-15', items: ['重命名“动画模式”按钮为“KeyFrame”', '开启 KeyFrame 模式时自动切换至“编辑(Edit)”模式'] },
  { version: 'v26.0215.1445', date: '2026-02-15', items: ['优化关键帧动画播放逻辑：点击播放时自动从0秒开始，并实现无限循环播放'] },
  { version: 'v26.0215.1430', date: '2026-02-15', items: ['修复导出SVG动画无法播放的问题（修正关键帧百分比计算与时间单位）', '优化代码面板预览逻辑，确保动画参数与导出文件一致'] },
  { version: 'v26.0215.1400', date: '2026-02-15', items: ['优化SVG导出逻辑，仅包含实际使用的材质与渐变定义', '修复代码预览面板中缺少SVG Defs定义的问题', '进一步减小导出文件体积'] },
  { version: 'v26.0215.1315', date: '2026-02-15', items: ['修复代码面板生成的SVG代码中缺少关键帧动画定义的问题', '优化SVG导出逻辑，确保自定义关键帧动画(CSS Animation)被正确包含', '统一编辑器与导出代码的动画表现'] },
  { version: 'v26.0215.1300', date: '2026-02-15', items: ['修复动画模式下旋转中心未跟随图形位移的问题（计算Pivot时应用平移变换）', '修复构建时的类型错误与变量冗余'] },
  { version: 'v26.0215.1230', date: '2026-02-15', items: ['修复 useDraw.ts 语法错误导致的应用崩溃', '修复动画模式下编辑模型时的位置突变与选中失效问题', '实现点击命中检测的逆变换逻辑，支持精准选中已变换图形'] },
  { version: 'v26.0215.1215', date: '2026-02-15', items: ['修复动画模式下无法选中已位移图形的问题（实现点击命中检测的逆变换逻辑）', '优化子图形点击判定，支持旋转/缩放后的精准选中'] },
  { version: 'v26.0215.1155', date: '2026-02-15', items: ['修复动画模式下编辑模型时位置突变的问题', '优化自动打帧逻辑，确保拖拽、旋转、缩放操作基于当前动画状态'] },
  { version: 'v26.0215.1140', date: '2026-02-15', items: ['新增关键帧动画时间轴交互', '支持关键帧选中与缓动函数(Easing)配置', '优化时间轴视觉样式与操作体验'] },
  { version: 'v26.0215.1125', date: '2026-02-15', items: ['修复编辑模式下逆时针旋转时角度示意弧线显示异常的问题'] },
  { version: 'v26.0215.1110', date: '2026-02-15', items: ['图层面板支持 Shift 键多选（与 Photoshop 逻辑一致）', '重构选择逻辑，支持单选、Ctrl 多选和 Shift 范围选择'] },
  { version: 'v26.0215.1040', date: '2026-02-15', items: ['修复 CodePanel 导入 SVG 时描边颜色错误（黑色描边）的问题', '修复无描边 SVG 路径添加 Glow 动画时发光效果不显示的问题', 'Glow 动画现在会自动使用填充色作为发光色的回退'] },
  { version: 'v26.0214.1705', date: '2026-02-14', items: ['修复合并图层后，子图案动画在编辑模式下无法正常播放的问题'] },
  { version: 'v26.0214.1655', date: '2026-02-14', items: ['UI调整：移除右上角的版本号显示'] },
  { version: 'v26.0214.1650', date: '2026-02-14', items: ['UI调整：移除动画面板中的标题和版本号显示'] },
  { version: 'v26.0214.1645', date: '2026-02-14', items: ['修复代码面板应用更改后，动画丢失的问题'] },
  { version: 'v26.0214.1635', date: '2026-02-14', items: ['优化代码面板：显示动画关键帧，防止误触锁定代码更新'] },
  { version: 'v26.0214.1610', date: '2026-02-14', items: ['修复导出 SVG 和代码预览时，合并图层的样式（颜色、动画）与画布显示不一致的问题'] },
  { version: 'v26.0214.1522', date: '2026-02-14', items: ['修复合并图层后材质和动画丢失的问题，支持保留子图形的独立样式和动画'] },
  {
    version: 'v26.0214.1425',
    date: '2026-02-14',
    items: ['优化合并图层内的子图形选择逻辑，支持使用Ctrl键多选子图形并进行批量变换', '支持按住Ctrl点击合并图层中的多个子图形', '可对多个选中的子图形进行整体变换(平移/旋转/缩放)', '显示所有选中子图形的整体边界框和控制手柄']
  },
  {
    version: 'v26.0214.1418',
    date: '2026-02-14',
    items: ['修复合并图层中子图形选中后控制框立即消失的问题', '变换操作(平移/旋转/缩放)完成后保持子图形选中状态', '支持对单个子图形进行连续的变换操作']
  },
  {
    version: 'v26.0214.1400',
    date: '2026-02-14',
    items: ['彻底修复合并图层中子图形的控制框显示问题', '优化基于 data-segment-index 的点击命中逻辑，确保子图形变换（平移/旋转/缩放）独立生效', '完善未选中子图形时的整体变换回退机制']
  },
  {
    version: 'v26.0214.1350',
    date: '2026-02-14',
    items: ['完善合并图层中单个图形的选择高亮逻辑', '实现基于 data-segment-index 的子图形精准点击判定', '重构 PathItem 渲染方式，支持合并图层子路径的独立交互']
  },
  {
    version: 'v26.0214.1342',
    date: '2026-02-14',
    items: ['增强编辑模式下的背景点击检测，确保点击空白区域可正确取消选择', '修复合并图层点击判定逻辑，支持子图形的精准再次选中', '优化变换控制框的显示逻辑，仅在子图形被激活时呈现']
  },
  {
    version: 'v26.0214.1258',
    date: '2026-02-14',
    items: ['支持合并图层内部图形的单独编辑（位移）', '新增图层拆分 (Split) 功能，可将合并图层恢复为独立图层', '优化编辑模式下的图形碰撞判定算法']
  },
  {
    version: 'v26.0214.1620',
    date: '2026-02-14',
    items: ['实现图层面板 Ctrl + 点击多选功能', '修改图层合并逻辑为仅合并当前选中的多个图层', '支持多图层同步旋转、缩放与平移变换', '重构选择状态管理以支持批量操作']
  },
  {
    version: 'v26.0214.1205',
    date: '2026-02-14',
    items: ['修复合并图层在旋转/缩放时的路径畸变（破坏）问题', '优化 Canvas 渲染层的路径数据实时更新逻辑', '统一变换操作时的初始状态捕获机制', '修复编辑模式下的点击判定与变量引用错误']
  },
  {
    version: 'v26.0214.1200',
    date: '2026-02-14',
    items: ['修复合并图层后的旋转、缩放与平移变换失效问题', '优化复合路径（Multi-Path）在变换时的同步逻辑', '修复单点拖拽编辑在复合路径下的响应异常']
  },
  {
    version: 'v26.0214.1152',
    date: '2026-02-14',
    items: ['彻底修复合并图层后的异常连接线条', '优化无动画状态下的复合路径渲染', '恢复合并后所有顶点的编辑手柄显示']
  },
  {
    version: 'v26.0214.1143',
    date: '2026-02-14',
    items: ['修复图层合并导致的形状变形问题', '新增复合路径 (Compound Path) 支持', '优化 SVG 导出时的路径生成逻辑']
  },
  {
    version: 'v26.0214.1141',
    date: '2026-02-14',
    items: ['图层面板新增操作栏', '新增图层向下合并与全显合并功能', '支持图层上移/下移调整', '优化图层状态同步']
  },
  {
    version: 'v26.0214.1135',
    date: '2026-02-14',
    items: ['新增缩放/平移功能', '新增缩放比例指示器', '画布增加边界线', '新增精美版本日志对话框']
  },
  {
    version: 'v26.0209.0930',
    date: '2026-02-09',
    items: ['基础绘图功能', '图层管理器', '动画系统']
  }
];

function App() {
  const {
    paths,
    currentPoints,
    cursorPos,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleDoubleClick,
    handleContextMenu,
    symmetry,
    toggleSymmetry,
    tension,
    setTension,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    isClosed,
    setIsClosed,
    selectedPathIds,
    setSelectedPathIds,
    isDragging,
    handleAddShape,
    activeTool,
    setActiveTool,
    getBoundingBox,
    pointSnappingEnabled,
    setPointSnappingEnabled,
    guideSnappingEnabled,
    setGuideSnappingEnabled,
    deleteSelectedPath,
    duplicateSelectedPath,
    mergeSelected,
    splitSelected,
    moveSelectedUp,
    moveSelectedDown,
    moveSelectedToTop,
    moveSelectedToBottom,
    strokeOpacity,
    setStrokeOpacity,
    animation,
    setAnimation,
    setPathsInternal,
    handleAddText,
    fontFamily,
    setFontFamily,
    bgTransform,
    zoom,
    panOffset,
    isSpacePressed,
    undo,
    redo,
    canUndo,
    canRedo,
    clearCanvas,
    setPaths,
    mode,
    setMode,
    handleSelectPath,
    focusedSegmentIndices,
    transformMode,
    transformPivot,
    currentRotationDelta,
    isAnimationMode,
    setIsAnimationMode,
    currentTime,
    setCurrentTime,
    effectiveDuration,
    timelineDuration,
    isPlaying,
    togglePlayback,
    handleAddKeyframe,
    handleDeleteKeyframe,
    handleUpdateKeyframe,
    shapeStartPoint,
    isShiftPressed,
    currentScaleFactor,
    currentTranslationDelta,
    isReorderingLayers,
    setIsReorderingLayers,
    handlePointerUp,
    marqueeStart,
    marqueeEnd,
    isVertexEditEnabled,
    setIsVertexEditEnabled,
    setFocusedSegmentIndices,
    filter,
    setFilter,
    interactive,
    setInteractive
  } = useDraw();

  const totalVertices = useMemo(() => {
    const pathsCount = paths.reduce((sum, path) => {
      let count = path.points.length;
      if (path.multiPathPoints) {
        count += path.multiPathPoints.reduce((s, p) => s + p.length, 0);
      }
      return sum + count;
    }, 0);
    return pathsCount + currentPoints.length;
  }, [paths, currentPoints]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  /* Background Image Logic */
  const [backgroundImage, setBackgroundImage] = React.useState<string | null>(null);
  const [bgVisible, setBgVisible] = React.useState(true);
  const bgInputRef = useRef<HTMLInputElement>(null);

  /* Animation Control */
  const [animationPaused, setAnimationPaused] = React.useState(false);
  const [animationResetKey, setAnimationResetKey] = React.useState(0);
  const [showAnimPicker, setShowAnimPicker] = useState(false);
  const [showAnimPickerSlot, setShowAnimPickerSlot] = useState<string | null>(null);
  const [topTextInput, setTopTextInput] = useState('');
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimeoutRef = useRef<any>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showHelp, setShowHelp] = useState(true); // Default to true for new users
  const [canvasBgColor, setCanvasBgColor] = useState<string>('transparent'); // 'transparent', '#ffffff', '#1e293b', '#050b14'

  // Monitor zoom changes to show indicator
  React.useEffect(() => {
    if (zoom === 1) return; // Optional: skip initial render if needed, but usually zoom change is enough
    setShowZoomIndicator(true);
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 1500);
    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, [zoom]);

  React.useEffect(() => {
    console.log(`Fantastic SVG v26.0225.1010`);
    (window as any).setIsVertexEditEnabled = setIsVertexEditEnabled;
  }, [setIsVertexEditEnabled]);

  // Global keydown listener for help panel
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        // Only toggle if not in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setShowHelp(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleBgUploadClick = () => {
    bgInputRef.current?.click();
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
      setBgVisible(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearBg = () => {
    setBackgroundImage(null);
  };

  const handleLoadClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        if (Array.isArray(data)) {
          const valid = data.every((item: any) => item.points && Array.isArray(item.points));
          if (valid) setPaths(data);
          else alert('Invalid file format');
        }
      } catch (err) { alert('Failed to load file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportSvgClick = () => { svgInputRef.current?.click(); };

  const handleSvgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const svgString = event.target?.result as string;
        const importedPaths = parseSVGToPaths(svgString);
        if (importedPaths.length > 0) {
          setPaths(prev => [...prev, ...importedPaths]);
        } else {
          alert('Could not parse any paths from this SVG');
        }
      } catch (err) { alert('Failed to parse SVG'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveJson = () => {
    const data = JSON.stringify(paths);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = () => {
    if (!canvasRef.current) return;
    const width = 800;
    const height = 600;

    // Collect all used animation types
    const usedAnimations = new Set<string>();
    paths.filter(p => p.visible !== false).forEach(path => {
      if (path.animation?.entries) {
        path.animation.entries.forEach(entry => {
          usedAnimations.add(entry.type);
        });
      }
      if (path.segmentAnimations) {
        path.segmentAnimations.forEach(anim => {
          if (anim?.entries) {
            anim.entries.forEach(entry => {
              usedAnimations.add(entry.type);
            });
          }
        });
      }
    });

    // Only generate keyframes for used animations
    const keyframeMap: Record<string, string> = {
      draw: '@keyframes drawPath { to { stroke-dashoffset: 0; } }',
      pulse: '@keyframes pulsePath { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }',
      float: '@keyframes floatPath { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--float-dist, -10px)); } }',
      spin: '@keyframes spinPath { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      bounce: '@keyframes bouncePath { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.15, 0.85); } 60% { transform: scale(0.9, 1.1); } 80% { transform: scale(1.05, 0.95); } }',
      glow: '@keyframes glowPath { 0%, 100% { filter: drop-shadow(0 0 2px var(--glow-color, #22d3ee)) brightness(1); } 50% { filter: drop-shadow(0 0 12px var(--glow-color, #22d3ee)) brightness(1.6); } }',
      shake: '@keyframes shakePath { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }',
      swing: '@keyframes swingPath { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }',
      tada: '@keyframes tadaPath { 0% { transform: scale(1); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }'
    };

    let keyframes = Array.from(usedAnimations)
      .map(type => keyframeMap[type])
      .filter(Boolean)
      .join('\n  ');

    const hasInteractive = paths.some(p => p.interactive || p.segmentInteractive?.some(i => i));
    if (hasInteractive) {
      keyframes += `\n  .interactive-ui { transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; transform-box: fill-box; transform-origin: center; }
  .interactive-ui:hover { transform: scale(1.03); filter: brightness(1.1); }
  .interactive-ui:active { transform: scale(0.97); filter: brightness(0.9); }`;
    }

    // Generate Custom Keyframes for Path Layers
    paths.forEach(path => {
      // 1. Whole-layer keyframes
      if (path.keyframes && path.keyframes.length > 0) {
        const sortedFrames = [...path.keyframes].sort((a, b) => a.time - b.time);
        const steps = sortedFrames.map(kf => {
          const percentage = (kf.time / (effectiveDuration || 1)) * 100;
          const { x, y, rotation, scale, scaleX, scaleY, px = 0, py = 0 } = kf.value;
          const sx = scaleX ?? scale ?? 1;
          const sy = scaleY ?? scale ?? 1;
          return `${percentage.toFixed(2)}% { transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); transform-origin: calc(50% + ${px}px) calc(50% + ${py}px); animation-timing-function: ${kf.ease}; }`;
        }).join('\n    ');

        keyframes += `\n  @keyframes anim-${path.id} {\n    ${steps}\n  }`;
      }

      // 2. Per-segment keyframes for merged layers
      if (path.segmentKeyframes && path.segmentKeyframes.length > 0) {
        path.segmentKeyframes.forEach((segKfs, idx) => {
          if (segKfs && segKfs.length > 0) {
            const sortedFrames = [...segKfs].sort((a, b) => a.time - b.time);
            const steps = sortedFrames.map(kf => {
              const percentage = (kf.time / (effectiveDuration || 1)) * 100;
              const { x, y, rotation, scale, scaleX, scaleY, px = 0, py = 0 } = kf.value;
              const sx = scaleX ?? scale ?? 1;
              const sy = scaleY ?? scale ?? 1;
              return `${percentage.toFixed(2)}% { transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); transform-origin: calc(50% + ${px}px) calc(50% + ${py}px); animation-timing-function: ${kf.ease}; }`;
            }).join('\n    ');

            keyframes += `\n  @keyframes anim-${path.id}-seg${idx} {\n    ${steps}\n  }`;
          }
        });
      }
    });

    const pathsCode = paths.filter(p => p.visible !== false).map(path => {
      const variants = applySymmetry(path.multiPathPoints || path.points, path.symmetry, width / 2, height / 2);

      const variantCode = variants.map(v => {
        const sOp = path.strokeOpacity ?? 1;
        const fOp = path.fillOpacity ?? 1;
        let finalCode = '';

        if (path.type === 'text') {
          const pt = v.points[0];
          const rotation = path.rotation || 0;
          const sx = v.type === 'H' || v.type === 'C' ? -1 : 1;
          const sy = v.type === 'V' || v.type === 'C' ? -1 : 1;
          const transform = ` transform="translate(${pt.x}, ${pt.y}) scale(${sx}, ${sy}) rotate(${rotation})"`;
          const fill = path.fill || path.color || '#22d3ee';
          const glowColor = (path.color && path.color !== 'none') ? path.color : (fill && fill !== 'none' ? fill : '#22d3ee');
          const glowStyle = path.animation?.entries?.some(e => e.type === 'glow') ? ` style="--glow-color: ${glowColor};"` : '';
          const textNode = `\t<text x="0" y="0" fill="${fill}" fill-opacity="${fOp}" stroke="${path.color || 'none'}" stroke-width="${path.width || 0}" stroke-opacity="${sOp}" font-size="${path.fontSize || 40}" font-family="${path.fontFamily || 'Inter, system-ui, sans-serif'}" text-anchor="middle" dominant-baseline="middle"${transform}${glowStyle}>${path.text}</text>`;
          finalCode = path.interactive ? `<g class="interactive-ui">${textNode}</g>` : textNode;
        } else {
          if (path.id.startsWith('merged-') && path.multiPathPoints && v.multiPoints && v.multiPoints.length > 0) {
            const groupings = path.segmentGroupings || v.multiPoints!.map(() => 1);
            let currentSIdx = 0;
            const groups = groupings.map((count) => {
              const groupPoints = v.multiPoints!.slice(currentSIdx, currentSIdx + count);
              const firstSIdx = currentSIdx;
              currentSIdx += count;

              const segColor = path.segmentColors?.[firstSIdx] || path.color || 'none';
              const segFill = path.segmentFills?.[firstSIdx] || path.fill || 'none';
              const segWidth = path.segmentWidths?.[firstSIdx] ?? (path.width ?? 2);
              const segAnim = path.segmentAnimations?.[firstSIdx];
              const segClosed = path.segmentClosed?.[firstSIdx] ?? path.closed;
              const segTension = path.segmentTensions?.[firstSIdx] ?? path.tension;

              const d = smoothPath(groupPoints, segTension, segClosed);

              let animWrapperStart = '';
              let animWrapperEnd = '';

              if (segAnim && segAnim.entries && segAnim.entries.length > 0) {
                segAnim.entries.forEach(entry => {
                  const { type, duration, delay, ease, direction = 'forward' } = entry;
                  let finalDirection = direction === 'forward' ? 'normal' : direction === 'alternate' ? 'alternate' : 'reverse';
                  if (type === 'spin' && (v.type === 'H' || v.type === 'V')) {
                    if (finalDirection === 'normal') finalDirection = 'reverse';
                    else if (finalDirection === 'reverse') finalDirection = 'normal';
                  }

                  let animStyle = `animation: ${type}Path ${duration}s ${ease} ${delay}s infinite forwards; `;
                  if (type === 'glow') {
                    const glowColor = (segColor && segColor !== 'none') ? segColor : (segFill && segFill !== 'none' ? segFill : '#22d3ee');
                    animStyle += `--glow-color: ${glowColor}; `;
                  }
                  if (finalDirection !== 'normal') animStyle += `animation-direction: ${finalDirection}; `;
                  if (type === 'draw') animStyle += 'stroke-dasharray: 1000; stroke-dashoffset: 1000; ';
                  if (['spin', 'bounce', 'swing', 'tada'].includes(type)) {
                    const segTrans = path.segmentTransforms?.[firstSIdx];
                    const px = segTrans?.px || 0;
                    const py = segTrans?.py || 0;
                    animStyle += `transform-origin: calc(50% + ${px}px) calc(50% + ${py}px); transform-box: fill-box; `;
                  }
                  if (type === 'float' && (v.type === 'V' || v.type === 'C')) animStyle += '--float-dist: 10px; ';

                  animWrapperStart += `<g style="${animStyle}">`;
                  animWrapperEnd = `</g>` + animWrapperEnd;
                });
              }

              const segFilter = path.segmentFilters?.[firstSIdx] || path.filter || 'none';
              const filterAttr = segFilter !== 'none' ? ` filter="${segFilter}"` : '';
              let segmentNode = `<path d="${d}" stroke="${segColor}" stroke-opacity="${sOp}" stroke-width="${segWidth}" fill="${segFill}" fill-opacity="${fOp}" stroke-linecap="round" stroke-linejoin="round"${filterAttr} />`;
              if (path.interactive || path.segmentInteractive?.[firstSIdx]) {
                segmentNode = `<g class="interactive-ui">${segmentNode}</g>`;
              }

              // Apply Segment-specific Keyframes or Static Transform
              const segKfs = path.segmentKeyframes?.[firstSIdx];
              const segTrans = path.segmentTransforms?.[firstSIdx];

              if (segKfs && segKfs.length > 0) {
                const durationSec = effectiveDuration / 1000;
                const px = segTrans?.px || 0;
                const py = segTrans?.py || 0;
                const animStyle = `animation: anim-${path.id}-seg${firstSIdx} ${durationSec}s linear infinite; transform-box: fill-box; transform-origin: calc(50% + ${px}px) calc(50% + ${py}px);`;
                segmentNode = `<g style="${animStyle}">${segmentNode}</g>`;
              } else if (segTrans) {
                const { x, y, rotation, scale, scaleX, scaleY, px = 0, py = 0 } = segTrans;
                if (x !== 0 || y !== 0 || rotation !== 0 || scale !== 1 || (scaleX && scaleX !== 1) || (scaleY && scaleY !== 1) || px !== 0 || py !== 0) {
                  const sx = scaleX ?? scale ?? 1;
                  const sy = scaleY ?? scale ?? 1;
                  const transformStyle = `transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); transform-box: fill-box; transform-origin: calc(50% + ${px}px) calc(50% + ${py}px);`;
                  segmentNode = `<g style="${transformStyle}">${segmentNode}</g>`;
                }
              }

              return `${animWrapperStart}${segmentNode}${animWrapperEnd}`;
            }).join('\n');
            finalCode = `<g>${groups}</g>`;
          } else {
            const d = smoothPath(v.multiPoints || v.points, path.tension, path.closed);
            const glowColor = (path.color && path.color !== 'none') ? path.color : (path.fill && path.fill !== 'none' ? path.fill : '#22d3ee');
            const filterAttr = path.filter && path.filter !== 'none' ? ` filter="${path.filter}"` : '';
            const hasGlowAnim = path.animation?.entries?.some(e => e.type === 'glow') ?? false;
            const pathNode = `\t<path d="${d}" stroke="${path.color || 'none'}" stroke-opacity="${sOp}" stroke-width="${path.width ?? 2}" fill="${path.fill || 'none'}" fill-opacity="${fOp}" stroke-linecap="round" stroke-linejoin="round"${hasGlowAnim ? ` style="--glow-color: ${glowColor};"` : ''}${filterAttr} />`;
            finalCode = path.interactive ? `<g class="interactive-ui">${pathNode}</g>` : pathNode;
          }
        }

        if (path.animation && path.animation.entries && path.animation.entries.length > 0) {
          const entries = path.animation.entries;

          entries.forEach(entry => {
            const { type, duration, delay, ease, direction = 'forward' } = entry;
            let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
              direction === 'forward' ? 'normal' :
                direction === 'alternate' ? 'alternate' : 'reverse';

            let styleStr = `animation: ${type}Path ${duration}s ${ease} ${delay}s infinite forwards;`;
            if (type === 'glow') {
              const glowColor = (path.color && path.color !== 'none') ? path.color : (path.fill && path.fill !== 'none' ? path.fill : '#22d3ee');
              styleStr += ` --glow-color: ${glowColor};`;
            }

            if (type === 'spin' && (v.type === 'H' || v.type === 'V')) {
              if (finalDirection === 'normal') finalDirection = 'reverse';
              else if (finalDirection === 'reverse') finalDirection = 'normal';
            }

            if (finalDirection === 'reverse') styleStr += ' animation-direction: reverse;';
            if (finalDirection === 'alternate') styleStr += ' animation-direction: alternate;';

            if (type === 'draw') styleStr += ' stroke-dasharray: 1000; stroke-dashoffset: 1000;';
            if (type === 'spin' || type === 'bounce' || type === 'swing' || type === 'tada') {
              const px = path.transform?.px || 0;
              const py = path.transform?.py || 0;
              styleStr += ` transform-origin: calc(50% + ${px}px) calc(50% + ${py}px); transform-box: fill-box;`;
            }

            if (type === 'float' && (v.type === 'V' || v.type === 'C')) {
              styleStr += ' --float-dist: 10px;';
            }

            finalCode = `<g style="${styleStr}">${finalCode}</g>`;
          });
        }

        return finalCode;
      }).join('\n');

      // Wrap in keyframe animation group if applicable
      if (path.keyframes && path.keyframes.length > 0) {
        const animName = `anim-${path.id}`;
        // Note: duration here is the global timeline duration (in ms, convert to seconds)
        const durationSec = effectiveDuration / 1000;
        const px = path.transform?.px || 0;
        const py = path.transform?.py || 0;
        return `<g style="animation: ${animName} ${durationSec}s linear infinite; transform-box: fill-box; transform-origin: calc(50% + ${px}px) calc(50% + ${py}px);">
          ${variantCode}
        </g>`;
      }

      // If no keyframes but we have a static transform (that isn't identity), we should apply it
      // But wait, in the editor, the transform is applied via style.
      // If we export without animation, we should at least export the static transform position.
      if (path.transform) {
        const { x, y, rotation, scale, scaleX, scaleY, px = 0, py = 0 } = path.transform;
        if (x !== 0 || y !== 0 || rotation !== 0 || scale !== 1 || (scaleX && scaleX !== 1) || (scaleY && scaleY !== 1) || px !== 0 || py !== 0) {
          const sx = scaleX ?? scale ?? 1;
          const sy = scaleY ?? scale ?? 1;
          return `<g style="transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); transform-box: fill-box; transform-origin: calc(50% + ${px}px) calc(50% + ${py}px);">
                  ${variantCode}
              </g>`;
        }
      }

      return variantCode;
    }).join('\n');

    // Collect used defs (gradients, patterns)
    const usedDefs = new Set<string>();
    const checkAndAddDef = (color: string | undefined) => {
      if (!color) return;
      const match = color.match(/url\(#([^)]+)\)/);
      if (match && match[1]) {
        usedDefs.add(match[1]);
      }
    };

    paths.filter(p => p.visible !== false).forEach(path => {
      checkAndAddDef(path.fill);
      checkAndAddDef(path.color); // stroke color
      checkAndAddDef(path.filter); // filter
      path.segmentColors?.forEach(c => checkAndAddDef(c));
      path.segmentFills?.forEach(f => checkAndAddDef(f));
      path.segmentFilters?.forEach(f => checkAndAddDef(f));
    });

    const defsContent = Array.from(usedDefs)
      .map(id => SVG_DEF_MAP[id])
      .filter(Boolean)
      .join('\n');

    const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${defsContent}
  </defs>
  <style>
${keyframes}
  </style>
${pathsCode}
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      if (isInput) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      else if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (ctrl && e.key.toLowerCase() === 'd') { if (selectedPathIds.length > 0) { e.preventDefault(); duplicateSelectedPath(); } }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedPathIds.length > 0) { e.preventDefault(); deleteSelectedPath(); } }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateSelectedPath, deleteSelectedPath, selectedPathIds]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <header className="h-14 border-b border-border bg-slate-950/80 backdrop-blur-md flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Fantastic <span className="text-primary/50 font-normal">SVG</span>
            <button
              onClick={() => setShowChangelog(true)}
              className="ml-2 text-[10px] font-mono text-slate-500 tracking-tighter align-top opacity-70 hover:opacity-100 hover:text-primary transition-all active:scale-95"
            >
              v26.0225.1220
            </button>
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
          <span id="busuanzi_container_site_pv" className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
            VIEWS: <span id="busuanzi_value_site_pv" className="text-primary tracking-wider">-</span>
          </span>
          <div className="w-px h-3 bg-white/10"></div>
          <span id="busuanzi_container_site_uv" className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
            VISITORS: <span id="busuanzi_value_site_uv" className="text-blue-400 tracking-wider">-</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 border-r border-border bg-slate-950 relative overflow-y-auto">
          <Toolbar
            tension={tension} setTension={setTension}
            onSave={handleExportSvg} onSaveJson={handleSaveJson} onLoad={handleLoadClick}
            onImportSvg={handleImportSvgClick}
            strokeColor={strokeColor} setStrokeColor={setStrokeColor}
            fillColor={fillColor} setFillColor={setFillColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
            isClosed={isClosed} setIsClosed={setIsClosed}
            onBgUpload={handleBgUploadClick} onBgClear={handleClearBg}
            bgVisible={bgVisible} setBgVisible={setBgVisible}
            hasBg={!!backgroundImage} mode={mode} setMode={setMode}
            strokeOpacity={strokeOpacity}
            setStrokeOpacity={setStrokeOpacity}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            selectedPathType={paths.find(p => selectedPathIds.includes(p.id))?.type}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            filter={filter}
            setFilter={setFilter}
            interactive={interactive}
            setInteractive={setInteractive}
          />
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          <input type="file" ref={svgInputRef} className="hidden" accept=".svg" onChange={handleSvgFileChange} />
          <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgFileChange} />
        </aside>

        <section className="flex-1 bg-[#020617] p-4 overflow-hidden relative flex flex-col items-center justify-start gap-2 pt-4">
          <div className="flex bg-slate-900/50 backdrop-blur-sm p-1.5 rounded-xl border border-white/5 shadow-xl gap-1">
            <button
              onClick={() => { setActiveTool('brush'); setMode('draw'); }}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'brush' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Brush Tool (Freehand)"
            >
              <Brush size={20} />
            </button>
            <button
              onClick={() => { setActiveTool('pen'); setMode('draw'); }}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'pen' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Pen Tool (Points)"
            >
              <Pencil size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center" />
            <button
              onClick={() => handleAddShape('square')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'square' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Square Tool"
            >
              <Square size={20} />
            </button>
            <button
              onClick={() => handleAddShape('circle')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'circle' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Circle Tool"
            >
              <CircleIcon size={20} />
            </button>
            <button
              onClick={() => handleAddShape('triangle')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'triangle' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Triangle Tool"
            >
              <Triangle size={20} />
            </button>
            <button
              onClick={() => handleAddShape('star')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'star' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Star Tool"
            >
              <Star size={20} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 self-center" />

            <div className="relative group flex items-center">
              <input
                type="text"
                value={topTextInput}
                onChange={(e) => setTopTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && topTextInput.trim()) {
                    handleAddText(topTextInput);
                    setTopTextInput('');
                  }
                }}
                placeholder="Add Text..."
                className="w-32 bg-black/40 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:w-48 transition-all"
              />
              <Type size={14} className="absolute left-2.5 text-slate-500 group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          <div className="relative">
            {/* Quick Access Sidebar (Snapping & Symmetry) */}
            <div className="absolute -left-16 top-0 flex flex-col gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl z-40 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Snapping Group */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setPointSnappingEnabled(!pointSnappingEnabled)}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${pointSnappingEnabled ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Snap to Points"
                >
                  <Magnet size={20} />
                </button>
                <button
                  onClick={() => setGuideSnappingEnabled(!guideSnappingEnabled)}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${guideSnappingEnabled ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Snap to Guides"
                >
                  <LayoutGrid size={20} />
                </button>
              </div>

              <div className="h-px w-6 bg-white/10 mx-auto my-1" />

              {/* Symmetry Group */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => toggleSymmetry('horizontal')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 active:scale-90 ${symmetry.horizontal ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Horizontal Symmetry (H)"
                >
                  H
                </button>
                <button
                  onClick={() => toggleSymmetry('vertical')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 active:scale-90 ${symmetry.vertical ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Vertical Symmetry (V)"
                >
                  V
                </button>
                <button
                  onClick={() => toggleSymmetry('center')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 active:scale-90 ${symmetry.center ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Center Symmetry (C)"
                >
                  C
                </button>
              </div>

              <div className="h-px w-6 bg-white/10 mx-auto my-1" />

              {/* Canvas Background Color Group */}
              <div className="flex flex-col gap-1.5 py-1">
                {[
                  { id: 'transparent', label: 'T', bg: 'bg-slate-800', inner: 'checkerboard' },
                  { id: '#ffffff', label: 'W', bg: 'bg-white', text: 'text-black' },
                  { id: '#1e293b', label: 'G', bg: 'bg-slate-700' },
                  { id: '#050b14', label: 'B', bg: 'bg-black' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCanvasBgColor(item.id)}
                    className={cn(
                      "w-8 h-8 mx-1 flex items-center justify-center rounded-lg text-[10px] font-black transition-all duration-300 active:scale-90 border",
                      canvasBgColor === item.id
                        ? "border-primary shadow-[0_0_10px_rgba(34,211,238,0.4)] scale-110"
                        : "border-white/10 opacity-70 hover:opacity-100 hover:scale-105"
                    )}
                    title={`Background: ${item.id === 'transparent' ? 'Checkerboard' : item.id}`}
                  >
                    <div className={cn(
                      "w-full h-full rounded-[6px] flex items-center justify-center overflow-hidden",
                      item.bg,
                      item.text || "text-white"
                    )}>
                      {item.inner === 'checkerboard' ? (
                        <div className="w-full h-full" style={{ backgroundImage: 'conic-gradient(#334155 90deg, #1e293b 90deg 180deg, #334155 180deg 270deg, #1e293b 270deg)', backgroundSize: '8px 8px' }} />
                      ) : (
                        item.label
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-[800px] h-[600px] shadow-2xl shadow-black/50 rounded-xl relative overflow-hidden">
              <Canvas
                paths={paths} currentPoints={currentPoints} cursorPos={cursorPos}
                onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave} onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu} tension={tension} symmetry={symmetry}
                canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
                isClosed={isClosed} backgroundImage={backgroundImage}
                bgVisible={bgVisible} mode={mode}
                selectedPathIds={selectedPathIds} onPathSelect={(id) => {
                  if (id) setSelectedPathIds([id]);
                  else setSelectedPathIds([]);
                  setFocusedSegmentIndices([]);
                }}
                isDragging={isDragging}
                activeTool={activeTool}
                getBoundingBox={getBoundingBox}
                animationPaused={animationPaused || isReorderingLayers}
                bgTransform={bgTransform}
                zoom={zoom}
                panOffset={panOffset}
                isSpacePressed={isSpacePressed}
                focusedSegmentIndices={focusedSegmentIndices}
                transformMode={transformMode}
                transformPivot={transformPivot}
                currentRotationDelta={currentRotationDelta}
                isAnimationMode={isAnimationMode}
                currentTime={currentTime}
                animationResetKey={animationResetKey}
                marqueeStart={marqueeStart}
                marqueeEnd={marqueeEnd}
                shapeStartPoint={shapeStartPoint}
                isShiftPressed={isShiftPressed}
                currentScaleFactor={currentScaleFactor}
                currentTranslationDelta={currentTranslationDelta}
                isVertexEditEnabled={isVertexEditEnabled}
                onPointerUp={handlePointerUp}
                canvasBgColor={canvasBgColor}
              />

              {/* Vertex Count Indicator */}
              <div className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-md rounded-full border border-white/5 shadow-xl pointer-events-none select-none">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vertices:</span>
                <span className="text-xs font-black text-white tabular-nums">{totalVertices}</span>
              </div>

              {/* Zoom Indicator Overlay */}
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500 z-[100]",
                  showZoomIndicator ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
              >
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                  <div className="text-primary-foreground/50 text-[10px] font-black uppercase tracking-[0.2em]">Zoom</div>
                  <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    {Math.round(zoom * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {mode === 'edit' && selectedPathIds.length > 0 && (
              <div className="absolute -right-16 top-0 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl transition-all animate-in fade-in slide-in-from-left-2">
                <button
                  onClick={() => setIsVertexEditEnabled(!isVertexEditEnabled)}
                  className={cn(
                    "p-3 rounded-lg transition-all",
                    isVertexEditEnabled
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                  title="Toggle Vertex Selection"
                >
                  <MousePointerClick size={20} />
                </button>
                <button
                  onClick={duplicateSelectedPath}
                  className="p-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                  title="Duplicate (Ctrl+D)"
                >
                  <Copy size={20} />
                </button>
                <button
                  onClick={deleteSelectedPath}
                  className="p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-110 active:scale-95 transition-all"
                  title="Delete (Del/Backspace)"
                >
                  <Scissors size={20} />
                </button>
              </div>
            )}

            {/* Bottom-Right Controls (Undo, Redo, Clear) */}
            <div className="absolute -right-16 bottom-0 flex flex-col gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl z-40 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${canUndo ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={20} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${canRedo ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={20} />
                </button>
              </div>

              <div className="h-px w-6 bg-white/10 mx-auto my-1" />

              <button
                onClick={clearCanvas}
                className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-300 active:scale-90"
                title="Clear All"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* Animation Controls Panel - Multi-Slot Version */}
          {(() => {
            const ANIM_TYPES: import('./types').AnimationType[] = ['draw', 'pulse', 'float', 'spin', 'bounce', 'glow', 'shake', 'swing', 'tada'];
            const ANIM_COLORS: Record<string, string> = {
              draw: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
              pulse: 'text-violet-400 bg-violet-500/20 border-violet-500/40',
              float: 'text-sky-400 bg-sky-500/20 border-sky-500/40',
              spin: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
              bounce: 'text-green-400 bg-green-500/20 border-green-500/40',
              glow: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
              shake: 'text-red-400 bg-red-500/20 border-red-500/40',
              swing: 'text-pink-400 bg-pink-500/20 border-pink-500/40',
              tada: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
            };
            const EASE_OPTIONS = [
              { value: 'linear', label: 'Linear' },
              { value: 'ease', label: 'Ease' },
              { value: 'ease-in-out', label: 'Smooth' },
              { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Elastic' },
            ];

            const entries = animation.entries ?? [];
            const sortedEntries = [...entries].sort((a, b) => a.delay - b.delay);
            const isAnimOff = animation.paused === true;
            const canAddMore = sortedEntries.length < 9;

            const updateEntry = (id: string, patch: Partial<import('./types').AnimationEntry>) => {
              const newEntries = entries.map(e => e.id === id ? { ...e, ...patch } : e)
                .sort((a, b) => a.delay - b.delay);
              setAnimation({ ...animation, entries: newEntries });
            };

            const removeEntry = (id: string) => {
              const newEntries = entries.filter(e => e.id !== id);
              setAnimation({ ...animation, entries: newEntries });
            };

            return (
              <div className="w-[800px] mt-2 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
                {/* Top Row: controls */}
                <div className="flex items-center gap-2 p-2">
                  {/* Play/Stop */}
                  <div className="flex items-center gap-1.5 border-r border-white/5 pr-3">
                    <button
                      onClick={() => setAnimationPaused(!animationPaused)}
                      className={`p-1.5 rounded-md transition-all hover:scale-110 active:scale-95 ${animationPaused
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                        }`}
                      title={animationPaused ? '播放动画' : '暂停动画'}
                    >
                      {animationPaused ? (
                        <Play className="w-3.5 h-3.5" fill="currentColor" />
                      ) : (
                        <Pause className="w-3.5 h-3.5" fill="currentColor" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAnimationResetKey(prev => prev + 1);
                        setAnimationPaused(true);
                      }}
                      className="p-1.5 rounded-md transition-all hover:scale-110 active:scale-95 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                      title="停止动画"
                    >
                      <SquareIcon className="w-3.5 h-3.5" fill="currentColor" />
                    </button>
                  </div>

                  {/* OFF Button */}
                  <button
                    onClick={() => setAnimation({ ...animation, paused: !isAnimOff })}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all border ${isAnimOff
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'text-slate-500 border-slate-700/50 hover:text-white hover:border-slate-600'
                      }`}
                    title={isAnimOff ? '动画已关闭，点击开启' : '关闭动画（保留参数）'}
                  >
                    OFF
                  </button>

                  {/* 9 Slots */}
                  <div className="flex gap-1 flex-1">
                    {Array.from({ length: 9 }).map((_, i) => {
                      const entry = sortedEntries[i];
                      const isSelected = entry && showAnimPickerSlot === entry.id;
                      if (entry) {
                        const colorClass = ANIM_COLORS[entry.type] || 'text-slate-400 bg-slate-700/40 border-slate-600/40';
                        return (
                          <button
                            key={entry.id}
                            onClick={() => setShowAnimPickerSlot(prev => prev === entry.id ? null : entry.id)}
                            className={`flex-1 h-7 rounded border text-[9px] font-bold uppercase transition-all ${isSelected
                              ? colorClass + ' ring-1 ring-current scale-[1.04]'
                              : colorClass + ' opacity-80 hover:opacity-100'
                              }`}
                            title={`${entry.type} · delay ${entry.delay}s`}
                          >
                            {entry.type.slice(0, 3)}
                          </button>
                        );
                      }
                      // Empty slot
                      return (
                        <div key={`empty-${i}`} className="flex-1 h-7 rounded border border-dashed border-slate-700/40 bg-slate-800/20" />
                      );
                    })}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => setShowAnimPicker(p => !p)}
                    disabled={!canAddMore}
                    className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-bold transition-all ${canAddMore
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:scale-110 active:scale-95'
                      : 'border-slate-700/40 bg-slate-800/20 text-slate-600 cursor-not-allowed'
                      }`}
                    title={canAddMore ? '添加动画' : '已达最大数量（9条）'}
                  >
                    +
                  </button>
                </div>

                {/* Params Row: when a slot is selected */}
                {showAnimPickerSlot && (() => {
                  const entry = entries.find(e => e.id === showAnimPickerSlot);
                  if (!entry) return null;
                  const colorClass = ANIM_COLORS[entry.type] || '';
                  return (
                    <div className="border-t border-white/5 px-3 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Type Badge */}
                      <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${colorClass} shrink-0`}>
                        {entry.type}
                      </div>
                      <div className="w-px h-4 bg-white/10 shrink-0" />

                      {/* Duration */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Dur</span>
                        <input
                          type="number"
                          min={0.1} max={20} step={0.1}
                          value={entry.duration}
                          onChange={e => updateEntry(entry.id, { duration: parseFloat(e.target.value) || 0 })}
                          onBlur={e => updateEntry(entry.id, { duration: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
                          className="w-14 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-indigo-300 font-mono focus:outline-none focus:border-indigo-500/50 text-center"
                        />
                        <span className="text-[8px] text-slate-600">s</span>
                      </div>

                      {/* Delay */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Delay</span>
                        <input
                          type="number"
                          min={0} max={30} step={0.1}
                          value={entry.delay}
                          onChange={e => updateEntry(entry.id, { delay: parseFloat(e.target.value) || 0 })}
                          className="w-14 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-indigo-300 font-mono focus:outline-none focus:border-indigo-500/50 text-center"
                        />
                        <span className="text-[8px] text-slate-600">s</span>
                      </div>

                      {/* Ease */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Ease</span>
                        <select
                          value={entry.ease}
                          onChange={e => updateEntry(entry.id, { ease: e.target.value })}
                          className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-indigo-500/50"
                        >
                          {EASE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>

                      {/* Direction */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Dir</span>
                        <select
                          value={entry.direction}
                          onChange={e => updateEntry(entry.id, { direction: e.target.value as any })}
                          className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-indigo-500/50"
                        >
                          <option value="forward">Forward</option>
                          <option value="reverse">Reverse</option>
                          <option value="alternate">Alternate</option>
                        </select>
                      </div>

                      {/* Repeat Controls */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <button
                          onClick={() => updateEntry(entry.id, { repeat: !entry.repeat })}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all border ${entry.repeat
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                            : 'text-slate-500 border-slate-700/50 hover:text-slate-300'
                            }`}
                          title={entry.repeat ? '有限次数播放' : '无限循环播放'}
                        >
                          {entry.repeat ? 'Repeat' : 'Loop'}
                        </button>
                        {entry.repeat && (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                            <input
                              type="number"
                              min={1} max={100} step={1}
                              value={entry.repeatCount}
                              onChange={e => updateEntry(entry.id, { repeatCount: parseInt(e.target.value) || 0 })}
                              onBlur={e => updateEntry(entry.id, { repeatCount: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-10 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px] text-indigo-300 font-mono focus:outline-none focus:border-indigo-500/50 text-center"
                            />
                            <span className="text-[8px] text-slate-600 uppercase">x</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1" />

                      {/* Delete */}
                      <button
                        onClick={() => { removeEntry(entry.id); setShowAnimPickerSlot(null); }}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95"
                        title="删除此动画"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })()}

                {/* Animation Type Picker Popup */}
                {showAnimPicker && (
                  <div className="border-t border-white/5 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2">选择动画类型</div>
                    <div className="grid grid-cols-9 gap-1.5">
                      {ANIM_TYPES.map(type => {
                        const colorClass = ANIM_COLORS[type] || '';
                        return (
                          <button
                            key={type}
                            onClick={() => {
                              const newEntry: import('./types').AnimationEntry = {
                                id: `anim-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                type,
                                duration: 2,
                                delay: 0,
                                ease: 'ease-in-out',
                                direction: 'forward',
                                repeat: false,
                                repeatCount: 1,
                              };
                              const newEntries = [...entries, newEntry].sort((a, b) => a.delay - b.delay);
                              setAnimation({ ...animation, entries: newEntries });
                              setShowAnimPicker(false);
                              setShowAnimPickerSlot(newEntry.id);
                            }}
                            className={`py-1 rounded border text-[9px] font-bold uppercase transition-all hover:scale-105 active:scale-95 ${colorClass}`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <Timeline
            currentTime={currentTime}
            duration={timelineDuration}
            isPlaying={isPlaying}
            onTimeChange={setCurrentTime}
            onTogglePlay={togglePlayback}
            onAddKeyframe={handleAddKeyframe}
            onDeleteKeyframe={handleDeleteKeyframe}
            onUpdateKeyframe={handleUpdateKeyframe}
            keyframes={selectedPathIds.length === 1 ? (() => {
              const p = paths.find(p => p.id === selectedPathIds[0]);
              if (!p) return [];
              // If in focus mode for segments, show those keyframes
              if (focusedSegmentIndices.length > 0 && p.segmentKeyframes) {
                return p.segmentKeyframes[focusedSegmentIndices[0]] || [];
              }
              return p.keyframes || [];
            })() : []}
            isAnimationMode={isAnimationMode}
            onToggleAnimationMode={() => {
              const nextMode = !isAnimationMode;
              setIsAnimationMode(nextMode);
              if (nextMode) {
                setMode('edit');
                // Automatically add a 0s keyframe for selected paths if they have none
                if (selectedPathIds.length > 0) {
                  setPaths(prev => prev.map(p => {
                    if (selectedPathIds.includes(p.id)) {
                      let updatedP = { ...p };

                      // 1. Handle focused segments if any
                      if (focusedSegmentIndices.length > 0 && p.multiPathPoints) {
                        const newSegmentKeyframes = [...(p.segmentKeyframes || p.multiPathPoints.map(() => undefined))];
                        while (newSegmentKeyframes.length < p.multiPathPoints.length) {
                          newSegmentKeyframes.push(undefined);
                        }

                        let modified = false;
                        focusedSegmentIndices.forEach(idx => {
                          if (!newSegmentKeyframes[idx] || newSegmentKeyframes[idx]!.length === 0) {
                            const segTransform = p.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                            newSegmentKeyframes[idx] = [{
                              id: `kf-${p.id}-seg${idx}-0`,
                              time: 0,
                              value: { ...segTransform },
                              ease: 'linear'
                            }];
                            modified = true;
                          }
                        });

                        if (modified) {
                          updatedP.segmentKeyframes = newSegmentKeyframes;
                        }
                      }

                      // 2. Handle whole-layer keyframes if no segments are focused
                      if (focusedSegmentIndices.length === 0 && (!p.keyframes || p.keyframes.length === 0)) {
                        updatedP.keyframes = [{
                          id: `kf-${p.id}-0`,
                          time: 0,
                          value: { ...(p.transform || { x: 0, y: 0, rotation: 0, scale: 1 }) },
                          ease: 'linear'
                        }];
                      }

                      return updatedP;
                    }
                    return p;
                  }));
                }
              }
            }}
            className="w-[800px] mt-1"
          />

          {/* Keyboard Shortcut Help Panel */}
          {showHelp && (
            <div className="absolute top-4 left-4 w-44 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-4 duration-500 group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-[9px] font-black text-white uppercase tracking-wider">Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
                >
                  <X size={10} />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between group/item">
                  <span className="text-[8px] text-slate-400 font-medium">Draw Snap</span>
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-white/5 text-[7px] font-bold text-slate-200 group-hover/item:border-primary/30 transition-colors shadow-sm">Shift</kbd>
                </div>
                <div className="flex items-center justify-between group/item">
                  <span className="text-[8px] text-slate-400 font-medium">Axis Snap</span>
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-white/5 text-[7px] font-bold text-slate-200 group-hover/item:border-primary/30 transition-colors shadow-sm">Shift</kbd>
                </div>
                <div className="flex items-center justify-between group/item">
                  <span className="text-[8px] text-slate-400 font-medium">Pan Canvas</span>
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-white/5 text-[7px] font-bold text-slate-200 group-hover/item:border-primary/30 transition-colors shadow-sm">Space</kbd>
                </div>
                <div className="flex items-center justify-between group/item">
                  <span className="text-[8px] text-slate-400 font-medium">Zoom</span>
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-white/5 text-[7px] font-bold text-slate-200 group-hover/item:border-primary/30 transition-colors shadow-sm">Ctrl+Wheel</kbd>
                </div>
                <div className="flex items-center justify-between group/item">
                  <span className="text-[8px] text-slate-400 font-medium">Undo/Redo</span>
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-white/5 text-[7px] font-bold text-slate-200 group-hover/item:border-primary/30 transition-colors shadow-sm">Ctrl+Z/Y</kbd>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[7px] text-slate-500 font-medium italic">Toggle panel</span>
                <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-white/5 text-[7px] font-bold text-primary transition-colors shadow-sm">?</kbd>
              </div>
            </div>
          )}
        </section>
        <aside className="w-80 p-4 border-l border-border bg-slate-950 flex flex-col gap-4 overflow-hidden">
          <div className="flex-[3] min-h-0 flex flex-col">
            <LayerPanel
              paths={paths}
              selectedPathIds={selectedPathIds}
              onSelect={handleSelectPath}
              onReorder={setPathsInternal}
              onToggleVisibility={(id) => {
                if (selectedPathIds.includes(id) && selectedPathIds.length > 1) {
                  // Batch toggle visibility based on the state of the clicked item
                  const targetLayer = paths.find(p => p.id === id);
                  const nextVisible = !(targetLayer?.visible !== false);
                  setPaths(prev => prev.map(p => selectedPathIds.includes(p.id) ? { ...p, visible: nextVisible } : p));
                } else {
                  setPaths(prev => prev.map(p => p.id === id ? { ...p, visible: !(p.visible !== false) } : p));
                }
              }}
              onToggleLock={(id) => {
                if (selectedPathIds.includes(id) && selectedPathIds.length > 1) {
                  // Batch toggle lock based on the state of the clicked item
                  const targetLayer = paths.find(p => p.id === id);
                  const nextLocked = !targetLayer?.locked;
                  setPaths(prev => prev.map(p => selectedPathIds.includes(p.id) ? { ...p, locked: nextLocked } : p));
                } else {
                  setPaths(prev => prev.map(p => p.id === id ? { ...p, locked: !p.locked } : p));
                }
              }}
              onDelete={(id) => {
                if (selectedPathIds.includes(id) && selectedPathIds.length > 1) {
                  setPaths(prev => prev.filter(p => !selectedPathIds.includes(p.id)));
                  setSelectedPathIds([]);
                } else {
                  setPaths(prev => prev.filter(p => p.id !== id));
                  setSelectedPathIds(prev => prev.filter(item => item !== id));
                }
              }}
              onMerge={mergeSelected}
              onSplit={splitSelected}
              onMoveUp={moveSelectedUp}
              onMoveDown={moveSelectedDown}
              onMoveToTop={moveSelectedToTop}
              onMoveToBottom={moveSelectedToBottom}
              onSelectAll={() => setSelectedPathIds(paths.map(p => p.id))}
              onDeselectAll={() => setSelectedPathIds([])}
              onReorderStart={() => setIsReorderingLayers(true)}
              onReorderEnd={(newPaths) => {
                setPaths(newPaths);
                setIsReorderingLayers(false);
              }}
            />
          </div>
          <div className="flex-[2] min-h-0 flex flex-col">
            <CodePanel paths={paths} tension={tension} isDragging={isDragging} onApplyCode={setPaths} duration={effectiveDuration} />
          </div>
        </aside>
      </main>

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-800/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                更新日志
              </h2>
              <button
                onClick={() => setShowChangelog(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
              {CHANGELOG.map((log) => (
                <div key={log.version} className="relative pl-6 border-l-2 border-primary/20 hover:border-primary/50 transition-colors">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-black text-white font-mono">{log.version}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{log.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {log.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-white/20 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-slate-800/30 border-t border-white/5 text-center">
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                感谢使用 Fantastic SVG · 祝您创作愉快
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
