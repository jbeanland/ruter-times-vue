<template>
  <div id="app">
    <router-view/>
  </div>
</template>


<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  display: flex;
  flex-direction: column;
  height: 100%;
}
html, nav {
    background: #000000 !important;
}

html {
  height: 100%;
}

body {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

</style>
