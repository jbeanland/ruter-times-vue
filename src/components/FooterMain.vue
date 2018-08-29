<template>

    <footer class="footer">
        <div class="content has-text-centered">
            <p>
                <span class="text-muted">By Jack Beanland, 2018.
                    <a href="https://github.com/jbeanland/ruter-times-vue" id='github-link'>
                        <font-awesome-icon :icon="['fab', 'github']" class="white"/>
                    </a>
                </span>
            </p>
        </div>
    </footer>

</template>

<style scoped>

.footer {
  padding: .75rem 1rem .75rem !important;
  position: relative;
  bottom: 0;
  width: 100%;
  background-color: #5a5a5a !important;
  color: white !important;
}

#github-link {
    margin-left: 0.625rem;
}

.white {
    color: white;
}

</style>
