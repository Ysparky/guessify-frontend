import { createPinia } from "pinia";
import { createApp } from "vue";
import Toast, { type PluginOptions, POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css";
import App from "./App.vue";
import router from "./router";
import "./style.css";

const app = createApp(App);

const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 4000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: true,
  hideProgressBar: false,
  closeButton: false,
  icon: true,
  rtl: false,
  maxToasts: 3,
  newestOnTop: true,
  transition: {
    enter: "Vue-Toastification__bounce",
    leave: "Vue-Toastification__fade",
    move: "Vue-Toastification__move",
  },
};

app.use(createPinia());
app.use(router);
app.use(Toast, toastOptions);

app.mount("#app");
