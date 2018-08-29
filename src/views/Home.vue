<!-- TODO:
* Turn into PWA so I can load it independently of Heroku's servers.
* put refresh button on each platform and save scroll position.
* force https
 -->

<template>
<div id="home">

    <navbar-main
        :stops="stops"
        :currentStop="currentStop"
        :favourites="favourites"
        :placeholder="placeholder"
        :currentIsFavourite="currentIsFavourite"
        :isLoading="isLoading"
        @refresh="refresh"
        @change-stop="changeStop"
        @remove-favourite="removeFavourite"
        @set-favourite="setFavourite"
    ></navbar-main>


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

    <footer-main/>

</div>
</template>



<script>
import Timetable from '@/components/Timetable.vue'
import FooterMain from '@/components/FooterMain.vue'
import NavbarMain from '@/components/NavbarMain.vue'
import axios from 'axios'

export default {
    name: 'main-view',
    data() {
        return {
            stops: [],
            favourites: [],
            lastUpdated: null,
            transportTypes: new Set([2, 8]),
            departureTimes: [],
            currentStop: null,
            currentDate: Date.now(),
            placeholder: 'Stop...',
            errorMessage: '',
            isLoading: false,
        };
    },
    components: {
        Timetable,
        FooterMain,
        NavbarMain,
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
                this.errorMessage = '';
                this.placeholder = 'Stop...'
                this.departureTimes = [];
            }
        }
    },
    mounted() {

        this.getStops();

        // get favourites from localstorage
        var fav = JSON.parse(localStorage.getItem('fav'))
        if (fav != null) {
            this.favourites = fav;
        }

        // setup currentTime callback
        this.interval = setInterval(() => { this.currentDate = Date.now(); }, 1000);

        // if it is the home route, do nothing - this should show nothing, else perform update.
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

        getStops () {
            // get stops from localstorage or from api
            var s = localStorage.getItem('stops')
            if (s) {
                this.stops = JSON.parse(s);
                // TODO: refresh stops every n days.
                // TODO: store transport types wanted alongside so the user can select what they want, refresh when different to chosen options.
            }
            else {
                this.getStopsFresh();
            }
        },

        getStopsFresh: function () {
            // Go get transport stops from the api.
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

        changeStop (stop) {
            // push new stop to the router
            if (stop) {
                this.$router.push({name: 'stop', params: {value: stop.value}})
            }
        },

        update (stopId) {
            // Update after coming from the router
            const stop = this.stops.find((a)=> { return a.value == stopId});

            if (stop) {
                window.document.title = "Ruter - " + stop.label;
                this.getTimes(stop);
            } else {
                this.errorMessage = "Oops, looks like that stop ID doesn't exist, or at least I don't have it. Try searching instead.";
            }
        },

        refresh () {
            // For clicking the refresh button. do nothing if no current stop
            if (this.currentStop != null) {
                this.getTimes(this.currentStop);
            }
        },

        getTimes: function (stop) {
            // Get data for a stop. Stop is passed as the {'value': 1234567, 'label': 'Central Station'} object
            this.currentStop = stop;
            this.placeholder = stop.label
            this.isLoading = true;

            const path = 'https://reisapi.ruter.no/StopVisit/GetDepartures/' + stop.value;
            axios.get(path)
            .then((response) => {
                this.formatTimes(response.data);
                // TODO: if no data (eg middle of night so no trains) give some warning message - not broken just empty. need new div for warning instead of error
            })
            .catch(() => {
                this.errorMessage = "Looks like something went wrong while fetching the data from Ruter. Try again in a moment or check your connection"

            })
            .then(() => {
                this.isLoading = false;
                this.currentDate = Date.now();
                this.lastUpdated = Date.now();
            });
        },

        formatTimes (data) {
            // Take raw data from api and format it. Specifically:
            //   sort each result by platform and add a field for how far away in minutes it is.
            // End up with:
            //      platforms = [{'platform': '1', results: [record 1, record 3, ...]},
            //                   {'platform': '2', results: [record 2, record 4, ...]},
            //                  ];

            var platforms = [];

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
                localStorage.setItem('fav', JSON.stringify(this.favourites));
            }
        },

        removeFavourite: function () {
            if ( this.currentFavouriteIndex >= 0 ) {
                this.favourites.splice(this.currentFavouriteIndex, this.currentFavouriteIndex + 1);
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
        currentIsFavourite () {
            if (this.currentFavouriteIndex >= 0) {
                return true;
            } else {
                return false;
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
                if (diff == 1) {
                    return "Yesterday";
                }
                return diff + ' days  ago';
            }

            diff = Math.floor(seconds / 3600);
            if (diff >= 1) {
                if (diff == 1) {
                    return "1 hour ago";
                }
                return diff + ' hours  ago';
            }

            diff = Math.floor(seconds / 60);
            if (diff >= 1) {
                if (diff == 1) {
                    return "1 minute ago";
                }
                return diff + ' minutes  ago';
            }

            return seconds + ' seconds ago';
        },
    },
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

.main-container {
    max-width: 100%;
    padding: .5rem;
    margin-right: 0 !important;
    margin-left: 0 !important;
    flex: 1 0 auto;
}

.message {
    max-width: 500px
}

.message-header {
    background-color: #5a5a5a;
}

.message-body {
    background-color: #CCCCCC;
}

#message-container {
    padding: .5rem;
}

#error-message {
    margin: 1rem 1rem 1rem;
}

#error-message-body {
    background-color: #ff0000;
    color: black;
    font-weight: bold;
    border: 0;
}

</style>
