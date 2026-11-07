/* GDL_Tutorial 主题入口：默认主题 + 数字蓝图视觉覆盖 + 全局组件 */
import DefaultTheme from 'vitepress/theme'
import GdlPlayground from './components/GdlPlayground.vue'
import CommandTable from './components/CommandTable.vue'
import GlobTable from './components/GlobTable.vue'
import SnippetList from './components/SnippetList.vue'
import ErrorList from './components/ErrorList.vue'
import ProgressPanel from './components/ProgressPanel.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component('GdlPlayground', GdlPlayground)
    app.component('CommandTable', CommandTable)
    app.component('GlobTable', GlobTable)
    app.component('SnippetList', SnippetList)
    app.component('ErrorList', ErrorList)
    app.component('ProgressPanel', ProgressPanel)
  }
}
