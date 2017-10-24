//Returns total number of hours for a given entry
//DEPRECATED – now calculated by formula in Google sheet
// function parse_timecode(entry){
//     begin = entry['gsx$begin']['$t']
//     end = entry['gsx$end']['$t']
//
//     minutes = end.slice(2,4) - begin.slice(2,4)
//     hours = end.slice(0,2) - begin.slice(0,2)
//
//     //In case we're doing something around midnight
//     if (hours < 0){
//         hours = (end.slice(0,2) + 24) - begin.slice(0,2)
//     }
//
//     return hours + (minutes/60)
// }
function parse_timecode(entry){
    return parseFloat(entry['gsx$hours']['$t']);
}

//TODO: Create a function that returns entries and stats for a given time period
function data_range(in_data, start_date, end_date){

    //Filter entries within range, then sort by date
    data = in_data.filter(function(entry){
        entry_date = Date.parse(entry['gsx$date']['$t']);
        date_in_range = end_date >= entry_date && entry_date >= start_date;
        return  date_in_range;
    }).sort(function(a,b){
        aDate = Date.parse(a['gsx$date']['$t']);
        bDate = Date.parse(b['gsx$date']['$t']);
        aTime = a['gsx$begin']['$t'];
        bTime = b['gsx$begin']['$t'];
        var date_compare = aDate > bDate ? -1 : bDate > aDate ? 1 : 0;
        var time_compare = aTime > bTime ? -1 : bTime > aTime ? 1 : 0;

        return date_compare || time_compare;
    })

    //Total hours for all sectors and tasks
    total_hours = data.reduce(function(sum, entry){
        return sum + parse_timecode(entry);
    }, 0);

    // Reduce sectors to object, then split into array of objects
    sectors = data.reduce(function(acc,curr){
        cc = curr['gsx$sector']['$t']
        acc[cc] ? acc[cc]+= parse_timecode(curr) : acc[cc] = parse_timecode(curr);
        return acc;
    }, {});
    sectors = Object.keys(sectors).map(function(key, index) {
        return {"name" : key, "amount": sectors[key]};
    });

    //Sort sectors by total entries?
    sectors.sort(function(a,b){
        return b.amount - a.amount;
    });

    return {
        "entries" : data,
        "total_hours" : total_hours,
        "sectors" : sectors
    };

}

function doData(json) {

    //All data
    data = json.feed.entry;

    //Get dates
    today = new Date();

    seven_days_ago = new Date();
    seven_days_ago.setDate(today.getDate() - 7);

    fourteen_days_ago = new Date();
    fourteen_days_ago.setDate(today.getDate() - 14);

    this_week = data_range(data, seven_days_ago, today)

    last_week = data_range(data, fourteen_days_ago, seven_days_ago)

    //Get hours per sector and display it as a list
    var stats = document.getElementById('stats');

    this_week.sectors.slice(0,2).forEach(function(sector){
        row = document.createElement("tr")
        stats.appendChild(row);

        td = document.createElement("td");
        td.innerHTML = sector.name;
        row.appendChild(td)

        td = document.createElement("td");
        td.innerHTML = sector.amount.toFixed(1) + " hrs <br>";
        row.appendChild(td)
    });

    //Append latest to the table
    var log = document.getElementById('log');

    this_week.entries.forEach(function(element, index){
        row = log.insertRow(index + 1);

        date = row.insertCell(0);
        date.innerHTML = element['gsx$date']['$t'];

        project = row.insertCell(1);
        project.innerHTML = element['gsx$project']['$t'];

        task = row.insertCell(2);
        //Append link to URL if available
        if (element['gsx$url']['$t']){
            link = document.createElement("a");
            link.href = element['gsx$url']['$t'];
            link.target = "_blank";
            link.innerHTML = element['gsx$task']['$t'];
            task.appendChild(link);
        }else{
            task.innerHTML = element['gsx$task']['$t'];
        }

        hours = row.insertCell(3);
        hours.innerHTML = parse_timecode(element).toFixed(1);

    });
}
