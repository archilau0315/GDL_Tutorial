// GDL_Tutorial 站点配置：双语 locale + 数字蓝图主题配置
import { defineConfig } from 'vitepress'
import { gdlGrammar } from './shiki-gdl/gdl.mts'
import { blueprintLight, blueprintDark } from './shiki-gdl/theme.mts'

const zhNav = [
  { text: '学习路径', link: '/guide/', activeMatch: '/guide/' },
  { text: '在线沙盒', link: '/playground/', activeMatch: '/playground/' },
  { text: '资料库', link: '/reference/', activeMatch: '/reference/' },
  { text: '命令速查', link: '/reference/commands/', activeMatch: '/reference/commands/' }
]

const enNav = [
  { text: 'Learning Path', link: '/en/guide/', activeMatch: '/en/guide/' },
  { text: 'Playground', link: '/en/playground/', activeMatch: '/en/playground/' },
  { text: 'Reference', link: '/en/reference/', activeMatch: '/en/reference/' },
  { text: 'Command Index', link: '/en/reference/commands/', activeMatch: '/en/reference/commands/' }
]

const zhSidebar = [
  {
    text: '第一部分 · 入门篇',
    collapsed: false,
    items: [
      { text: '学习路径总览', link: '/guide/' },
      { text: '第 0 章 认识 GDL', link: '/guide/part1-basics/00-getting-started' },
      { text: '第 1 章 第一个 3D 对象', link: '/guide/part1-basics/01-first-3d-object' },
      { text: '第 2 章 变换堆栈', link: '/guide/part1-basics/02-transform-stack' },
      { text: '第 3 章 参数化入门', link: '/guide/part1-basics/03-parameters' },
      { text: '第 4 章 2D 脚本', link: '/guide/part1-basics/04-2d-script' },
      { text: '第 5 章 控制流', link: '/guide/part1-basics/05-control-flow' }
    ]
  },
  {
    text: '第二部分 · 进阶篇',
    collapsed: false,
    items: [
      { text: '第 6 章 PRISM 全家族', link: '/guide/part2-intermediate/06-prism-family' },
      { text: '第 7 章 旋转与放样', link: '/guide/part2-intermediate/07-sweeps-and-revolves' },
      { text: '第 8 章 材质与属性', link: '/guide/part2-intermediate/08-materials' },
      { text: '第 9 章 宏与对象组织', link: '/guide/part2-intermediate/09-macros' },
      { text: '第 10 章 门窗对象', link: '/guide/part2-intermediate/10-doors-and-windows' },
      { text: '第 11 章 文本与字符串', link: '/guide/part2-intermediate/11-text-and-strings' },
      { text: '第 12 章 实战：参数化柜体', link: '/guide/part2-intermediate/12-practice-furniture' }
    ]
  },
  {
    text: '第三部分 · 精通篇',
    collapsed: true,
    items: [{ text: '待开放', link: '/guide/' }]
  },
  {
    text: '资料库',
    collapsed: false,
    items: [
      { text: '资料库总览', link: '/reference/' },
      { text: '命令速查表', link: '/reference/commands/' }
    ]
  },
  {
    text: '在线沙盒',
    collapsed: false,
    items: [
      { text: 'GDL 交互沙盒', link: '/playground/' }
    ]
  }
]

const enSidebar = [
  {
    text: 'Part 1 · Basics',
    collapsed: false,
    items: [
      { text: 'Learning Path Overview', link: '/en/guide/' },
      { text: 'Ch 0 Getting to Know GDL', link: '/en/guide/part1-basics/00-getting-started' },
      { text: 'Ch 1 Your First 3D Object', link: '/en/guide/part1-basics/01-first-3d-object' },
      { text: 'Ch 2 The Transformation Stack', link: '/en/guide/part1-basics/02-transform-stack' },
      { text: 'Ch 3 Introduction to Parametrics', link: '/en/guide/part1-basics/03-parameters' },
      { text: 'Ch 4 The 2D Script', link: '/en/guide/part1-basics/04-2d-script' },
      { text: 'Ch 5 Control Flow', link: '/en/guide/part1-basics/05-control-flow' }
    ]
  },
  {
    text: 'Part 2 · Intermediate',
    collapsed: false,
    items: [
      { text: 'Ch 6 The PRISM Family', link: '/en/guide/part2-intermediate/06-prism-family' },
      { text: 'Ch 7 Sweeps and Revolutions', link: '/en/guide/part2-intermediate/07-sweeps-and-revolves' },
      { text: 'Ch 8 Materials and Attributes', link: '/en/guide/part2-intermediate/08-materials' },
      { text: 'Ch 9 Macros and Object Structure', link: '/en/guide/part2-intermediate/09-macros' },
      { text: 'Ch 10 Doors and Windows', link: '/en/guide/part2-intermediate/10-doors-and-windows' },
      { text: 'Ch 11 Text and Strings', link: '/en/guide/part2-intermediate/11-text-and-strings' },
      { text: 'Ch 12 Practice: A Parametric Cabinet', link: '/en/guide/part2-intermediate/12-practice-furniture' }
    ]
  },
  {
    text: 'Part 3 · Advanced',
    collapsed: true,
    items: [{ text: 'Coming soon', link: '/en/guide/' }]
  },
  {
    text: 'Reference',
    collapsed: false,
    items: [
      { text: 'Reference Overview', link: '/en/reference/' },
      { text: 'Command Index', link: '/en/reference/commands/' }
    ]
  },
  {
    text: 'Playground',
    collapsed: false,
    items: [
      { text: 'GDL Interactive Playground', link: '/en/playground/' }
    ]
  }
]

// 部署 base 路径抽为环境变量，改路径不改代码（上线公司资源目录时配置）
const BASE = (process.env.GDL_BASE || '/').replace(/\/?$/, '/')

export default defineConfig({
  base: BASE,
  lang: 'zh-CN',
  title: 'GDL_Tutorial',
  description: 'Archicad GDL 从入门到精通 · 交互式双语教程与速查资料库',
  head: [['link', { rel: 'icon', href: `${BASE}favicon.svg` }]],
  markdown: {
    // 自定义 GDL 语法（Shiki TextMate grammar）+ 数字蓝图专用高亮主题
    languages: [gdlGrammar],
    theme: { light: blueprintLight, dark: blueprintDark }
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outline: { label: '本页内容', level: [2, 3] },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: { text: '最后更新' },
        search: { provider: 'local',
          options: { locales: { root: { translations: { button: { buttonText: '搜索', buttonAriaLabel: '搜索' } } } } } }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: { label: 'On this page', level: [2, 3] },
        lastUpdated: { text: 'Last updated' }
      }
    }
  },
  themeConfig: {
    logo: '/favicon.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/archilau0315/GDL_Tutorial' }],
    footer: {
      message: '内容原创 · 示例自写 · 命令数据整理自 Graphisoft 官方手册并注明出处'
    }
  }
})
