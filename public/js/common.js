// Let Vue.js ignore "sl-*" elements from Shoelace.js
Vue.config.ignoredElements = [/^sl-/];

// Install a two-way binding directive for Shoelace components with Vue.js
// Imported from: https://www.npmjs.com/package/@shoelace-style/vue-sl-model
const wm = new WeakMap();
Vue.use({
  install: function (Vue) {
    Vue.directive('sl-model', {
      bind (el, binding, vnode) {
        const inputHandler = event => Vue.set(vnode.context, binding.expression, event.target.value);
        wm.set(el, inputHandler);
        el.value = binding.value;
        el.addEventListener('input', inputHandler);
      },
      componentUpdated(el, binding) {
        el.value = binding.value;
      },      
      unbind(el) {
        const inputHandler = wm.get(el);
        el.removeEventListener(el, inputHandler);
      }
    })
  }    
});