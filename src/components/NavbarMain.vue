<template>

<nav class='navbar' role='navigation' aria-label='main navigation'>
    <div class='fill-space absolute'>

        <div class='navbar-brand fill-space absolute'>

            <div class='navbar-item'>
                <font-awesome-icon icon="hashtag" size="2x" class="red"/>
            </div>

            <div class="fill-space">

                <div class='navbar-item fill-space ' id='main-field'>
                    <div class='field has-addons fill-space'>

                        <p class="control is-pulled-right fill-space">
                             <b-autocomplete
                                id='input'
                                v-model="search"
                                :placeholder="placeholder"
                                :clear-on-select=true
                                :data="filteredData"
                                field="label"
                                @select="changeStop">
                            </b-autocomplete>
                        </p>

                        <p class="control ">
                            <button class="button is-black nav-button" id='refresh-button' @click="$emit('refresh')">
                                <font-awesome-icon icon="sync-alt" size="lg" class="green" :spin="isLoading"/>
                            </button>
                        </p>

                        <p class="control ">
                            <button v-if="currentIsFavourite" class='button is-black nav-button white' @click="$emit('remove-favourite')">
                                <font-awesome-icon icon="heart" size="lg" class="red"/>
                            </button>

                            <button v-else class='button is-black white nav-button' @click="$emit('set-favourite')">
                                <font-awesome-icon :icon="['far', 'heart']" size="lg" class="white"/>
                            </button>
                        </p>

                        <p class='control '>
                            <b-dropdown :mobile-modal=false position="is-bottom-left">
                                <button class="button is-black nav-button" slot="trigger" id="dropdown-button">
                                    <span>
                                        <font-awesome-icon icon="caret-down" size="lg" class="white"/>
                                    </span>
                                </button>

                                <b-dropdown-item
                                    v-for="(favourite, i) in favourites"
                                    :key="i"
                                    @click="changeStop(favourite)"
                                >{{ favourite.label}}</b-dropdown-item>
                            </b-dropdown>
                        </p>

                    </div>
                </div>
            </div>
        </div>
    </div>
</nav>

</template>


<script>


export default {
    name: "main-navbar",

    props: {
        stops: {
            type: Array,
            default: () => [],
        },
        favourites: {
            type: Array,
            default: () => [],
        },
        currentStop: {
            type: Object,
            default: () => { null },
        },
        placeholder: {
            type: String,
            default: 'Stop...',
        },
        currentIsFavourite: {
            type: Boolean,
            default: false,
        },
        isLoading: {
            type: Boolean,
            default: false,
        }
    },
    data () {
        return {
            search: '',
        accentMap: {
            "ø": "o",
            "Ø": "o",
            "æ": "ae",
            "Æ": "ae",
            "å": "a",
            "Å": "a",
        },

        };
    },
    methods: {

        normalise( term ) {
          var ret = "";
          for ( var i = 0; i < term.length; i++ ) {
            ret += this.accentMap[ term.charAt(i) ] || term.charAt(i);
          }
          return ret.toLowerCase();
        },

        changeStop (stop) {
            this.$emit('change-stop', stop);
        }
    },

    computed: {
        filteredData () {
            if (this.search.length < 3) {
                return [];
            } else {
                return this.stops.filter(item => this.normalise(item.label).indexOf(this.normalise(this.search)) > -1);
            }
        },
    },
};
</script>


<style scoped>
.nav-button {
    border-color: white !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
}

.fill-space {
    width: 100% !important;
}

.absolute {
    position: absolute !important;
}

.green {
    color: #30B000;
}

.white {
    color: white;
}

.red {
    color: #FF0000E6;
}

#refresh-button {
    border-left-width: 0 !important;
}

#main-field {
    padding-left: 0px !important;
    max-width: 500px;
}

#dropdown-button {
    background-color: black !important;
    border-color: white !important;
}

#dropdown-container {
    padding: .5rem !important;
    margin: auto;
}



</style>
