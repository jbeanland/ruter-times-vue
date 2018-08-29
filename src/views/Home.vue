<!-- TODO:
* Turn into PWA so I can load it independently of Heroku's servers.
* put refresh button on each platform and save scroll position.
* force https
 -->

<template>
  <div id="home">

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
                                <button class="button is-black nav-button" id='refresh-button' @click="refresh">
                                    <font-awesome-icon icon="sync-alt" size="lg" class="green" :spin="spin"/>
                                </button>
                            </p>
                            <p class="control ">

                                <button v-if="currentIsFavourite" class='button is-black nav-button white' @click="removeFavourite">
                                    <font-awesome-icon icon="heart" size="lg" class="red"/>
                                </button>

                                <button v-else class='button is-black white nav-button' @click='setFavourite'>
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

    <div id="message-container" v-if="errorMessage.length > 0">
        <article class="message" id="error-message">
            <div class="message-body" id='error-message-body'>
                {{ errorMessage }}
            </div>
        </article>
    </div>

    <div class='container main-container'>
        <div class='columns is-multiline'>


            <timetable v-for="(platform, i) in departureTimes" :key="i" :data="platform"/>



            <div class='column'>
                <article class="message is-small">
                    <div class="message-header">
                        <p>Last Updated:</p>
                    </div>
                    <div class="message-body">
                        {{ timeSinceUpdate }}
                    </div>
                </article>
            </div>
        </div>
    </div>


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




  </div>
</template>



<script>
import Timetable from '@/components/Timetable.vue'
import Autocomplete from '@/components/Autocomplete.vue'
import axios from 'axios'

export default {
    data() {
        return {
            stops: [],
            favourites: [],
            lastUpdated: null,
            transportTypes: new Set([2, 8]),
            departureTimes: [],
            currentStop: null,
            currentIsFavourite: false,
            currentDate: Date.now(),
            placeholder: 'Stop...',
            errorMessage: '',
            input: '',
            accentMap: {
                "ø": "o",
                "Ø": "o",
                "æ": "ae",
                "Æ": "ae",
                "å": "a",
                "Å": "a",
            },
            search: '',
            spin: false,
        };
    },
    components: {
        Timetable,
        Autocomplete,
    },
    watch: {
        '$route' () {
            const stopId = this.$route.params.value;
            if (stopId) {
                this.update(stopId);
            } else {
                window.document.title = "Ruter times"
                this.lastUpdated = null;
                this.currentStop = null;
                this.currentIsFavourite = false;
                this.errorMessage = '';
                this.placeholder = 'Stop...'
                this.departureTimes = [];

            }
        }
    },
    mounted() {

        // get stops from localstorage or from api
        var s = localStorage.getItem('stops')
        if (s) {
            this.stops = JSON.parse(s);
            // TODO: refresh stops every n days.
            // TODO: store transport types wanted alongside so the user can select what they want, refresh when different to chosen options.
        }
        else {
            this.getStops();
        }

        // get favourites from localstorage
        var fav = JSON.parse(localStorage.getItem('fav'))
        if (fav != null) {
            this.favourites = fav;
        }

        // setup currentTime callback
        this.interval = setInterval(this.setCurrentTime, 1000);

        // if it is the home route, do nothing - this should show nothing
        // else go update
        const stopId = this.$route.params.value;

        if (stopId) {
            this.update(stopId);
        }

    },
    destroyed () {
        clearInterval(this.interval);
    },
    methods: {
        // TODO: reorder generally as in best practices

        selected (item) {
            // console.log('selected', JSON.stringify(item));
            this.getTimes(item);
        },

        setInput (inp) {
            this.input = inp;
        },

        normalise( term ) {
          var ret = "";
          for ( var i = 0; i < term.length; i++ ) {
            ret += this.accentMap[ term.charAt(i) ] || term.charAt(i);
          }
          return ret.toLowerCase();
        },

        // Update after coming from the router
        update (stopId) {
            // this.search = ''
            // this.errorMessage = this.errorMessage + 'in update start\n'

            const stop = this.stops.find((a)=> { return a.value == stopId});

            // this.errorMessage = this.errorMessage + 'in update start' + stop.value + ' ' + stop.label + '\n';

            if (stop) {
                window.document.title = "Ruter - " + stop.label;
                // this.errorMessage = this.errorMessage + 'in Update end\n';
                this.getTimes(stop);
            } else {
                this.errorMessage = "Oops, looks like that stop ID doesn't exist, or at least I don't have it. Try searching instead.";

            }
        },
        setCurrentTime() {
            this.currentDate = Date.now();
        },

        // Go get transport stops from the api.
        getStops: function () {
            axios.get('https://reisapi.ruter.no/Line/GetLinesRuterExtended?ruterOperatedOnly=true')
            .then((res) => {

                var allStops = res.data.filter(i => this.transportTypes.has(i['Transportation']));
                var foundStops = new Set();
                var newStops = [];
                for (var i = 0; i < allStops.length; i++) {
                    var x = allStops[i].Stops;
                    for (var j = 0; j < x.length; j++) {
                        var y = x[j];
                        if (!foundStops.has(y.Id)) {
                            newStops.push({'value': y.Id, 'label': y.Name});
                            foundStops.add(y.Id);
                }}}
                this.stops = newStops;
                localStorage.setItem('stops', JSON.stringify(newStops));

            }).catch(() => {
                this.errorMessage = "Looks like something went wrong while fetching the data from Ruter. Try again in a moment or check your connection"
            });
        },

        // push new stop to the router
        changeStop (stop) {
            if (stop) {
                // this.search = '';
                this.$router.push({name: 'stop', params: {value: stop.value}})
                // this.search = '';
            }
        },

        // For clicking the refresh button. do nothing if no current stop
        refresh () {
            if (this.currentStop != null) {
                this.getTimes(this.currentStop);
            }
        },

        // Get data for a stop. Stop is passed as the {'value': 1234567, 'label': 'Central Station'} object
        getTimes: function (stop) {
            this.currentStop = stop;
            this.placeholder = stop.label

            if (this.currentFavouriteIndex >= 0) {
                this.currentIsFavourite = true;
            } else {
                this.currentIsFavourite = false;
            }

            this.spin = true;


            const path = 'https://reisapi.ruter.no/StopVisit/GetDepartures/' + stop.value;
            axios.get(path)
            .then((response) => {
                this.spin = false;
                this.setCurrentTime();
                this.lastUpdated = Date.now();
                this.formatData(response.data);
            })
            .catch(() => {
                this.spin = false;
                this.errorMessage = "Looks like something went wrong while fetching the data from Ruter. Try again in a moment or check your connection"

            });
        },

        // Take raw data from api and format it. Specifically:
        //  sort each result by platform and add a field for how far away in minutes it is
        formatData (data) {
            var platforms = [];

            // end up with:
            //      platforms = [{'platform': '1', results: [record 1, record 3, ...]},
            //                   {'platform': '2', results: [record 2, record 4, ...]},
            //                  ];


            for (var i = 0; i < data.length; i++) {
                var result = data[i];

                var departureTime = new Date(result.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime);
                var minsAway = Math.floor((departureTime - this.currentDate)/1000/60);

                if (minsAway <= 30) {

                    result.minsAway = minsAway;
                    var platform = result.MonitoredVehicleJourney.MonitoredCall.DeparturePlatformName;

                    var ind = platforms.findIndex(x => x.platform === platform);

                    if (ind >= 0) {
                        platforms[ind].results.push(result);
                    }
                    else {
                        platforms.push({
                            'platform': platform,
                            'results': [result],
                        });
                    }
                }
            }

            // sort list of platforms by name and within each platform by time until arrival.
            for (var j = 0; j < platforms.length; j++) {
                platforms[j].results.sort((a, b) => parseFloat(a.minsAway) - parseFloat(b.minsAway));
            }

            platforms.sort((a,b) => a.platform.localeCompare(b.platform))

            this.departureTimes = platforms;

        },

        setFavourite: function () {
            if (this.currentFavouriteIndex == -1) {
                this.favourites.push(this.currentStop);
                this.currentIsFavourite = true;
                localStorage.setItem('fav', JSON.stringify(this.favourites));
            }
        },

        removeFavourite: function () {
            if ( this.currentFavouriteIndex >= 0 ) {
                this.favourites.splice(this.currentFavouriteIndex, this.currentFavouriteIndex + 1);
                this.currentIsFavourite = false;
                localStorage.setItem('fav', JSON.stringify(this.favourites));
            }
        },

    },
    computed: {
        currentFavouriteIndex () {
            if (this.currentStop != null) {
                return this.favourites.findIndex((a) => {
                    return a.value == this.currentStop.value;
                });
            } else {
                return -1;
            }
        },
        timeSinceUpdate: function () {

            if (this.lastUpdated == null) {
                return 'never updated'
            }

            var seconds = Math.floor((this.currentDate - this.lastUpdated) / 1000);
            var diff = 0;

            diff = Math.floor(seconds / 86400);
            if (diff >= 1) {
                return diff + ' days  ago'
            }

            diff = Math.floor(seconds / 3600);
            if (diff >= 1) {
                return diff + ' hours  ago';
            }

            diff = Math.floor(seconds / 60);
            if (diff >= 1) {
                return diff + ' minutes  ago';
            }

            return seconds + ' seconds ago';
        },
        filteredData () {
            if (this.search.length < 3) {
                return [];
            } else {
                return this.stops.filter(item => this.normalise(item.label).indexOf(this.normalise(this.search)) > -1);
            }
        },
    }
};
</script>


<style>

#home {

  display: flex;
  flex-direction: column;
  height: 100%;
}

.columns {
    width: 100%;
    margin: 0 !important;
}

.message {
    max-width: 500px
}

.main-container {
    max-width: 100%;
    padding: .5rem;
    margin-right: 0 !important;
    margin-left: 0 !important;
    flex: 1 0 auto;
}

.rounded {
    border-radius: .25rem !important;
}

.shadow {
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15);
}

.white {
    color: white;
}

.red {
    color: #FF0000E6;
}

.green {
    color: #30B000;
}

.nav-button {
    border-color: white !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
}

#refresh-button {
    border-left-width: 0 !important;
}

#main-field {
    padding-left: 0px !important;
    max-width: 500px;
}

.fill-space {
    width: 100% !important;
}

.absolute {
    position: absolute !important;
}

#dropdown-button {
    background-color: black !important;
    border-color: white !important;

}

#dropdown-container {
    padding: .5rem !important;
    margin: auto;
}

.message-header {
    background-color: #5a5a5a;
}

.message-body {
    background-color: #CCCCCC;
}

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

#error-message {
    margin: 1rem 1rem 1rem;
}

#message-container {
    padding: .5rem;
}

#error-message-body {
    background-color: #ff0000;
    color: black;
    font-weight: bold;
    border: 0;
}

</style>
