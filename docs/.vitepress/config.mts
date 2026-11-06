// GDL_Tutorial 站点配置：双语 locale + 数字蓝图主题配置
import { defineConfig } from 'vitepress'
import { gdlGrammar } from './shiki-gdl/gdl.mts'

const zhNav = [
  { text: '学习路径', link: '/guide/', activeMatch: '/guide/' },
  { text: '资料库', link: '/reference/', activeMatch: '/reference/' },
  { text: '命令速查', link: '/reference/commands/', activeMatch: '/reference/commands/' }
]

const enNav = [
  { text: 'Learning Path', link: '/en/guide/', activeMatch: '/en/guide/' },
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
      { text: '第 1 章 第一个 3D 对象', link: '/guide/part1-basics/01-first-3d-object' }
    ]
  },
  {
    text: '第二部分 · 进阶篇',
    collapsed: true,
    items: [{ text: '待开放', link: '/guide/' }]
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
  }
]

const enSidebar = [
  {
    text: 'Part 1 · Basics',
    collapsed: false,
    items: [
      { text: 'Learning Path Overview', link: '/en/guide/' },
      { text: 'Ch 0 Getting to Know GDL', link: '/en/guide/part1-basics/00-getting-started' },
      { text: 'Ch 1 Your First 3D Object', link: '/en/guide/part1-basics/01-first-3d-object' }
    ]
  },
  {
    text: 'Part 2 · Intermediate',
    collapsed: true,
    items: [{ text: 'Coming soon', link: '/en/guide/' }]
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
  }
]

export default defineConfig({
  // 部署 base 路径抽为环境变量，改路径不改代码（上线公司资源目录时配置）
  base: process.env.GDL_BASE || '/',
  lang: 'zh-CN',
  title: 'GDL_Tutorial',
  description: 'Archicad GDL 从入门到精通 · 交互式双语教程与速查资料库',
  head: [['link', { rel: 'icon', href: '/favicon.svg' }]],
  markdown: {
    // 自定义 GDL 语法（Shiki TextMate grammar）
    languages: [gdlGrammar]
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
