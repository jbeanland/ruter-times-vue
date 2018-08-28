<!-- with help from https://alligator.io/vuejs/vue-autocomplete-component/ -->

<template>
    <div class='autocomplete'>
        <input
            type="text"
            class='input'
            @input="onChange"
            v-model='search'
            @keydown.down="onArrowDown"
            @keydown.up="onArrowUp"
            @keyup.enter="onEnter"
            @keyup.escape="onEscape"
            :placeholder="placeholder"
        />
        <ul
            class='autocomplete-results'
            v-show="isOpen && (results.length > 0)"
        >
            <li
                v-if='isLoading'
                class='loading'>Loading Results...
            </li>
            <li
            v-else
            class='autocomplete-result'
            :class="{ 'is-active': i === arrowCounter }"
            v-for="(result, i) in results"
            :key="i"
            @click="setResult(result)"
            >
                {{ result.label }}
            </li>
        </ul>
    </div>
</template>

<script>

export default {
    name: 'autocomplete',
    props: {
        items: {
            type: Array,
            required: false,
            default: () => [],
        },
        isAsync: {
            type: Boolean,
            required: false,
            default: false,
        },
        minLength: {
            type: Number,
            required: false,
            default: 3,
        },
        placeholder: {
            type: String,
            required: false,
            default: '',
        }
    },
    data() {
        return {
            search: '',
            results: [],
            isOpen: false,
            isLoading: false,
            arrowCounter: -1,
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
    watch: {
        items: function (value, oldValue) {
            if (this.isAsync) {
                this.results = value;
                this.isOpen = true;
                this.isLoading = false;
            }
        },
    },
    methods: {
        onChange() {
            console.log('onChange')
            if (this.search.length >= this.minLength) {

                this.$emit('input', this.search);

                if (this.isAsync) {
                    this.isLoading = true;
                } else {
                    this.filterResults();
                    this.isOpen = true;
                }

                this.arrowCounter = -1;
                this.isOpen = true;
                this.filterResults();
            } else {
                this.isOpen = false;
                this.arrowCounter = -1;
            }
        },
        filterResults() {
            this.results = this.items.filter(item => this.normalise(item.label).indexOf(this.normalise(this.search)) > -1);
        },
        setResult(result) {
            this.search = '';
            this.isOpen = false;
            this.arrowCounter = -1;
            this.results = [];
            this.$emit('result', result)
        },
        onEnter () {
            var result = this.results[this.arrowCounter];
            this.setResult(result);
        },
        onArrowDown () {
            if (this.arrowCounter < this.results.length - 1) {
                this.arrowCounter = this.arrowCounter + 1;
            }
            if (!this.isOpen) {
                this.isOpen = true;
            }
        },
        onArrowUp () {
            if (this.arrowCounter > 0) {
                this.arrowCounter = this.arrowCounter - 1;
            }
        },
        onEscape () {
            this.isOpen = false;
            this.arrowCounter = -1;
        },
        handleClickOutside(evt) {
            if (!this.$el.contains(evt.target)) {
                this.isOpen = false;
                this.arrowCounter = -1
            }
        },
        normalise( term ) {
          var ret = "";
          for ( var i = 0; i < term.length; i++ ) {
            ret += this.accentMap[ term.charAt(i) ] || term.charAt(i);
          }
          return ret.toLowerCase();
        },
    },
    mounted () {
        document.addEventListener('click', this.handleClickOutside);
    },
    destroyed () {
        document.removeEventListener('click', this.handleClickOutside);
    },
};

</script>





<style>
    .autocomplete {
        position: relative;
        /*width: 130px;*/
    }

    .autocomplete-results {
        padding: 0;
        margin: 0;
        border: 1px solid #eeeeee;
        height: 120px;
        overflow:auto;
        position: absolute;
        background-color: #f8f8f8;
        z-index: 10;
    }

    .autocomplete-result {
        list-style: none;
        text-align: left;
        padding: 4px 2px;
        cursor: pointer;
    }

    .autocomplete-result.is-active,
    .autocomplete-result:hover {
        background-color: #4AAE9B;
        color: white;
    }
</style>
