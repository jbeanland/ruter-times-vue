<template>

    <div class="column">
        <div class="card rounded shadow main-card">

            <div class='card-header'>
                <p class="card-header-title"  style="text-align:center">
                    Platform {{ data.platform }}
                </p>
            </div>

            <div class='card-content'>
                <div class="card">

                    <table class="table is-fullwidth">

                      <thead class='thead'>
                        <tr>
                          <th>Line</th>
                          <th>Destination</th>
                          <th>Time</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr v-for='(row, i) in data.results' :key="i">
                            <td>{{ row.MonitoredVehicleJourney.PublishedLineName }}</td>
                            <td>{{ row.MonitoredVehicleJourney.DestinationName }}</td>
                            <td>{{ timeToDeparture(row.minsAway) }}</td>
                        </tr>
                      </tbody>

                    </table>

                </div>
            </div>

        </div>
    </div>

</template>

<script>
    export default {
        props: {
            data: Object,
        },
        methods: {
            timeToDeparture (minsAway) {
                if (minsAway > 1) {
                    return minsAway + ' minutes';
                } else if (minsAway == 1) {
                    return '1 minute';
                } else {
                    return 'now';
                }

            }
        }
    };

</script>


<style scoped>

.container {
    max-width: 95% !important;
    padding: .5rem !important;
    margin-right: auto !important;
    margin-left: auto !important;
}

.rounded {
    border-radius: .25rem !important;
}

.shadow {
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15) !important;
}

.card-header {
    background: #FF0000E6 !important;
    border-top-right-radius: .25rem !important;
    border-top-left-radius: .25rem !important;
}

.card-content {
    padding: 0.625rem
}

.table {
    color: white !important;
    font-weight: bold !important;
}

thead {
    background: #CCCCCC !important;
}

.main-card {
    background-color: #5a5a5a !important;
}

tbody {
    background-color: black !important;
    /*background-color: #949494 !important;*/
}

td {
    border: 0px !important;
}

.border {
    border-width: 50px;
    border-color: red;
    border-spacing: 2rem;
}




</style>
