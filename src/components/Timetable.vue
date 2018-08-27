<template>

    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 p-1">
        <div class="card mb-4 shadow rounded border border-dark">
            <div class='card-header'>
                <p class="lead m-0"  style="text-align:center">
                    Platform {{ data.platform }}
                </p>
            </div>
            <div class='card-body p-2'>
                <div class="card m-0">
                    <table class="table">
                      <thead class='thead-dark'>
                        <tr>
                          <th>Line</th>
                          <th>Destination</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for='row in data.results'>
                            <td>{{ row.MonitoredVehicleJourney.PublishedLineName }}</td>
                            <td>{{ row.MonitoredVehicleJourney.DestinationName }}</td>
                            <td>{{ row.minsAway }}</td>
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
    };

</script>
