<!-- TODO:
* make it not crazy ugly.
* Turn into PWA so I can load it independently of Heroku's servers.
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
                            <autocomplete id='input' :items="stops" @result="changeStop" :placeholder="placeholder"/>
                        </p>
                        <p class="control ">
                            <button class="button is-black nav-button" @click="refresh">
                                <font-awesome-icon icon="sync-alt" size="lg" class="green"/>
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

                            <b-dropdown hoverable position="is-bottom-left">
                                <button class="button is-black nav-button" slot="trigger" id="dropdown-button">
                                    <span>
                                        <font-awesome-icon icon="caret-down" size="lg" class="white"/>

                                    </span>
                                </button>

                                <b-dropdown-item
                                    v-for="favourite in favourites"
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


    <div v-if="errorMessage.length > 0">
        {{ errorMessage }}
    </div>


    <div class='container'>
        <div class='columns is-multiline'>


            <!-- <div v-for="platform in departureTimes"> -->
                <timetable v-for="(platform, i) in departureTimes" :key="i" :data="platform"/>
            <!-- </div> -->
        </div>
    </div>
<!--
    <div>
        <p>
            Last Updated: {{ timeSinceUpdate }}
        </p>
    </div> -->





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
            // newStop: '',
            departureTimes: [],
            currentStop: null,
            currentIsFavourite: false,
            currentDate: Date.now(),
            placeholder: 'Stop...',
            errorMessage: '',
            dropdownActive: false,
        };
    },
    components: {
        Timetable,
        Autocomplete,
    },
    watch: {
        '$route' (to, from) {
            const newId = this.$route.params.value;
            const stop = this.stops.find((a)=> { return a.value == newId});
            if (stop) {
                this.getTimes(stop);
            }
        }
    },
    mounted() {
        console.log('mounting');

        // get stops from localstorage or from api
        var s = localStorage.getItem('stops')
        if (s) {
            this.stops = JSON.parse(s);
            console.log('get stops from localStorage');
            // TODO: refresh stops every n days.
            // TODO: store transport types wanted alongside so the user can select what they want, refresh when different to chosen options.
        }
        else {
            console.log('get stops fresh');
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
        if (this.$route.name != 'home') {
           this.update();
        }

        console.log('mounted');
    },
    destroyed () {
        clearInterval(this.interval);
    },
    methods: {
        // TODO: clear up methods a bit, make sure all through update or changeStop
        // TODO: reorder generally as in best practices
        // TODO: put errors in errorMessage


        // Update after coming from the router
        update () {
            console.log('update', this.$route.params.value);
            const newId = this.$route.params.value;
            const stop = this.stops.find((a)=> { return a.value == newId});
            if (stop) {
                this.getTimes(stop);
            } else {
                console.log('no such stop found')
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
                console.log(res);

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
                console.log(JSON.stringify(newStops));
                this.stops = newStops;
                localStorage.setItem('stops', JSON.stringify(newStops));

            }).catch((error) => {
                // TODO: proper error handling here
                console.log('error: ', error);
            });
        },

        // push new stop to the router
        changeStop (stop) {
            this.$router.push({name: 'stop', params: {value: stop.value}})
        },

        // For clicking the refresh button. do nothing if no current stop
        refresh () {
            if (this.currentStop != null) {
                console.log('refresh: currentid:', this.currentStop)
                this.getTimes(this.currentStop);
            }
        },

        // Get data for a stop. Stop is passed as the {'value': 1234567, 'label': 'Central Station'} object
        getTimes: function (stop) {
            // TODO: only do if stop is proper format
            this.errorMessage = '';
            this.currentStop = stop;
            console.log('get time for selected stop', stop.value);
            this.placeholder = stop.label

            const path = 'https://reisapi.ruter.no/StopVisit/GetDepartures/' + stop.value;
            console.log(path);
            axios.get(path)
            .then((response) => {
                this.setCurrentTime();
                this.lastUpdated = Date.now();
                this.formatData(response.data);

                if (this.currentFavouriteIndex >= 0) {
                    this.currentIsFavourite = true;
                } else {
                    this.currentIsFavourite = false;
                }

            })
            .catch((error) => {
                console.log('error', error)
                // TODO: proper error handling here
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
                console.log(this.currentStop);
                this.currentIsFavourite = true;
                localStorage.setItem('fav', JSON.stringify(this.favourites));
            }
        },

        removeFavourite: function () {
            console.log('removeFavourite', this.currentFavouriteIndex);
            if ( this.currentFavouriteIndex >= 0 ) {
                this.favourites.splice(this.currentFavouriteIndex, this.currentFavouriteIndex + 1);
                this.currentIsFavourite = false;
                localStorage.setItem('fav', JSON.stringify(this.favourites));
            }
        },

    },
    computed: {
        currentFavouriteIndex () {
            // TODO: ('error in evaluation') initially. add error handling for this
            return this.favourites.findIndex((a) => {
                return a.value == this.currentStop.value;
            });
        },
        timeSinceUpdate: function () {
            // TODO: look at using moment.js for this

            if (this.lastUpdated == null) {
                return 'never updated'
            }

            var seconds = Math.floor((this.currentDate - this.lastUpdated) / 1000);
            var diff = 0;

            diff = Math.floor(seconds / 86400);
            if (diff > 1) {
                return diff + ' days  ago'
            }

            diff = Math.floor(seconds / 3600);
            if (diff > 1) {
                return diff + ' hours  ago';
            }

            diff = Math.floor(seconds / 60);
            if (diff > 1) {
                return diff + ' minutes  ago';
            }

            return seconds + ' seconds ago';
        },
    }
};



</script>
















<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.container {
    max-width: 95%;
    padding: .5rem;
    margin-right: auto;
    margin-left: auto;
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

</style>
