import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)

// App bootstrap — keep this minimal. Wallet integrations will be added via adapters/providers.
app.mount('#app')
