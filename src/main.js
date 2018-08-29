import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Buefy from 'buefy'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faSyncAlt, faHeart, faCaretDown, faHashtag } from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import { faGithub} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import 'buefy/lib/buefy.css'

Vue.component(Buefy.Dropdown.name, Buefy.Dropdown)
Vue.component(Buefy.DropdownItem.name, Buefy.DropdownItem)
Vue.component(Buefy.Autocomplete.name, Buefy.Autocomplete)


library.add(faGithub, faSyncAlt, faHeart, faHeartRegular, faCaretDown, faHashtag)
Vue.component('font-awesome-icon', FontAwesomeIcon)


Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
