'use strict'

/* global siteConfig */

import Vue from 'vue'
import VueRouter from 'vue-router'
import VueClipboards from 'vue-clipboards'
import VueSimpleBreakpoints from 'vue-simple-breakpoints'
import VeeValidate from 'vee-validate'
import { ApolloClient } from 'apollo-client'
import { createPersistedQueryLink } from 'apollo-link-persisted-queries'
// import { BatchHttpLink } from 'apollo-link-batch-http'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import VueApollo from 'vue-apollo'
import Vuetify from 'vuetify'
import Velocity from 'velocity-animate'
import Hammer from 'hammerjs'
import moment from 'moment'
import VueMoment from 'vue-moment'
import VueTour from 'vue-tour'
import store from './store'

// ====================================
// Load Modules
// ====================================

import boot from './modules/boot'
import localization from './modules/localization'

// ====================================
// Load Helpers
// ====================================

import helpers from './helpers'

// ====================================
// Initialize Global Vars
// ====================================

window.WIKI = null
window.boot = boot
window.Hammer = Hammer

moment.locale(siteConfig.lang)

// ====================================
// Initialize Apollo Client (GraphQL)
// ====================================

const graphQLEndpoint = window.location.protocol + '//' + window.location.host + '/graphql'

const graphQLLink = createPersistedQueryLink().concat(
  createHttpLink({
    includeExtensions: true,
    uri: graphQLEndpoint,
    credentials: 'include',
    fetch: (uri, options) => {
      // Strip __typename fields from variables
      let body = JSON.parse(options.body)
      // body = body.map(bd => {
      //   return ({
      //     ...bd,
      //     variables: JSON.parse(JSON.stringify(bd.variables), (key, value) => { return key === '__typename' ? undefined : value })
      //   })
      // })
      body = {
        ...body,
        variables: JSON.parse(JSON.stringify(body.variables), (key, value) => { return key === '__typename' ? undefined : value })
      }
      options.body = JSON.stringify(body)

      // Inject authentication token
      options.headers.Authorization = `Bearer TODO`

      return fetch(uri, options)
    }
  })
)

window.graphQL = new ApolloClient({
  link: graphQLLink,
  cache: new InMemoryCache(),
  connectToDevTools: (process.env.node_env === 'development')
})

// ====================================
// Initialize Vue Modules
// ====================================

Vue.config.productionTip = false

Vue.use(VueRouter)
Vue.use(VueApollo)
Vue.use(VueClipboards)
Vue.use(VueSimpleBreakpoints)
Vue.use(localization.VueI18Next)
Vue.use(helpers)
Vue.use(VeeValidate, { events: '' })
Vue.use(Vuetify)
Vue.use(VueMoment, { moment })
Vue.use(VueTour)

Vue.prototype.Velocity = Velocity

// ====================================
// Register Vue Components
// ====================================

Vue.component('admin', () => import(/* webpackChunkName: "admin" */ './components/admin.vue'))
Vue.component('editor', () => import(/* webpackChunkName: "editor" */ './components/editor.vue'))
Vue.component('login', () => import(/* webpackMode: "eager" */ './components/login.vue'))
Vue.component('nav-header', () => import(/* webpackMode: "eager" */ './components/nav-header.vue'))
Vue.component('profile', () => import(/* webpackChunkName: "profile" */ './components/profile.vue'))
Vue.component('setup', () => import(/* webpackChunkName: "setup" */ './components/setup.vue'))
Vue.component('v-card-chin', () => import(/* webpackMode: "eager" */ './components/common/v-card-chin.vue'))

let bootstrap = () => {
  // ====================================
  // Notifications
  // ====================================

  window.addEventListener('beforeunload', () => {
    store.dispatch('startLoading')
  })

  const apolloProvider = new VueApollo({
    defaultClient: window.graphQL
  })

  // ====================================
  // Bootstrap Vue
  // ====================================

  const i18n = localization.init()
  window.WIKI = new Vue({
    el: '#app',
    components: {},
    mixins: [helpers],
    provide: apolloProvider.provide(),
    store,
    i18n
  })

  // ----------------------------------
  // Dispatch boot ready
  // ----------------------------------

  window.boot.notify('vue')

  // ====================================
  // Load Icons
  // ====================================

  import(/* webpackChunkName: "icons" */ './svg/icons.svg').then(icons => {
    document.body.insertAdjacentHTML('beforeend', icons.default)
  })
}

window.boot.onDOMReady(bootstrap)
