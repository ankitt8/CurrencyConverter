exports.csv_to_json = (csvfile) => {
    //the parameter csv file is in string
    lines = csvfile.split('\n');
    console.log(lines)
    //lines is array of string with first element as header row
    
    //in case there are multiple headers
    headers = lines[0].split(',');
    let result = []; //the array of objects
    //in our case as there is only one header below will also work fine
    // header = lines[0];
    // metrics = {}
    // let avg=0, min=0, median=0, maximum=0;
    // console.log('hi lines')
    // console.log(lines)
    for(let i=1; i < lines.length-1; ++i) {
        let obj = {};
        let current_line = lines[i].split(',');
        if(isNaN(current_line)) {return undefined;}
        //the size of current line will be same as that of header array
        for(let j=0; j < headers.length; ++j) {
            obj[headers[j]] = current_line[j];
            // avg += parseFloat(current_line[j]);
        }
        result.push(obj);

    }
    return JSON.stringify(result);
    // return result;

}