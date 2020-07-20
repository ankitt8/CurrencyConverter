
// import csv_to_json from 'csvJSON'
require('dotenv').config();

const express = require("express"),
  app = express(),
  upload = require("express-fileupload"),
  path = require('path'),
  fetch = require('node-fetch'),
  bodyParser = require('body-parser'),
  fs = require('fs');

let csvData = "test";
app.use(upload());
const port = 8080;
// ejs = require('ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));
// app.set('views', path.join(__dirname, 'views'))
app.set('view engine' ,'ejs')


app.get("/", (req, res, next) => {
  res.sendFile('index.html');
});

//file upload and conversion
app.post("/results", (req, res) => {
/** convert req buffer into csv string , 
*   "csvfile" is the name of my file given at name attribute in input tag */
  csvData = req.files.csvfile.data.toString('utf8');
  console.log(typeof csvData);
  console.log(csvData);
  const csv_to_json_module = require('./csvJSON.js');

  const csv_input_to_json = csv_to_json_module.csv_to_json(csvData);
  if(csv_input_to_json == undefined) {
    res.setHeader('Content-Type', 'text/html');
    error_message = 'CSV File should contain only numbers!! Please upload again';
    res.render('error', {error_message:error_message});
    
  }
  // console.log(typeof json);
  else {
    var output=['INR,USD'];

    const url = 'https://free.currconv.com/api/v7/convert?apiKey=f30092fe57597afb0f21&q=INR_USD&compact=ultra';
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    fetch(url)
          .then(response => response.json())
          .then(price_conversion_rate => {
            // console.log('price_conversion_rate'); {'INR_USD':0.234}
            // console.log(price_conversion_rate)
            // console.log('typeof csvinputtojson')
            // console.log(typeof csv_input_to_json)  answer is string

            required_json = JSON.parse(csv_input_to_json)
            // console.log('type of required_json');
            // console.log(typeof required_json); ans is json
            console.log(required_json)
            let min = max = median = avg = 0;
            // console.log(typeof required_json[0]['Amount'])
            min = max = Math.round( ( parseFloat(required_json[0]['Amount']) * 1000) / 1000 );
            // console.log('min')
            // console.log(min)
            // console.log(max)
            // console.log(typeof min)
            // console.log('avg')
            // console.log(avg)
            amount_in_dollar = [];
            amount_in_rupees = [];
            rate = price_conversion_rate['INR_USD']
            num_decmial_places = 3;
            factor = Math.pow(10,3);
            for(let i=0 ;i < required_json.length; ++i) {
                // console.log(required_json[i]);
                //  amount_in_rupees.push(Math.round( ( parseFloat(required_json[i]['Amount']) * 1000) / 1000 ));
                //  amount_in_dollar.push(Math.round( ((amount_in_rupees[i]*rate)*1000)/1000 ));
                amount_in_rupees.push(Math.round(parseFloat(required_json[i]['Amount'])*factor)/factor );
                
                amount_in_dollar.push(Math.round(amount_in_rupees[i]*rate * factor)/factor);
                let temp = amount_in_rupees[i] + ',' + amount_in_dollar[i];
                output.push(temp)
                if(amount_in_rupees[i] < min) {
                  min = amount_in_rupees[i];
                }
                if (amount_in_rupees[i] > max) {
                  max = amount_in_rupees[i];
                }
                avg += amount_in_rupees[i];
            }
            // console.log(amount_in_rupees.join(','));
            // output = output + amount_in_rupees.join('\n');
            console.log(output);
            output = output.join('\n');
            console.log(path.join(__dirname, 'output.csv'))
            fs.writeFile(path.join(__dirname, 'output.csv'), [output], "utf8", (err) => {
              if(err) {console.log(err);}
              else {
                console.log('Uploaded outputcsv file');
              }
            })
            median = 0;
            inr_temp =amount_in_rupees.slice();
            mid_index = Math.floor(inr_temp.length/2);
            if(inr_temp.length % 2 == 0) {
              median = (inr_temp[mid_index] + inr_temp[mid_index-1])/2;
            }else {
              median = inr_temp[mid_index]
            }
            let usd_min = Math.round(min*rate*factor)/factor;
            let usd_max = Math.round(max*rate*factor)/factor;
            let usd_avg = Math.round(avg*rate*factor)/factor;
            let usd_median = Math.round(median*rate*factor)/factor;
            metrics = {
              INR_min: min,
              INR_max: max,
              INR_avg: avg,
              INR_median:median,
              USD_min:usd_min,
              USD_max:usd_max,
              USD_avg:usd_avg,
              USD_median:usd_median
            }
            let INR_row = 'INR,'+ min + ',' + max + ',' + avg + ',' + median + '\n';
            let USD_row = 'USD,' + usd_min + ',' + usd_max + ',' + usd_avg + ',' + usd_median + '\n';
            let metrics_string = '#,Minimum,Maximum,Average,Median\n' + INR_row + USD_row;
            console.log(metrics_string);
            
            console.log(path.join(__dirname, 'metrics.csv'))
            fs.writeFile(path.join(__dirname, 'metrics.csv'), [metrics_string], "utf8", (err) => {
              if(err) {console.log(err);}
              else {
                console.log('Uploaded metricscsv file');
              }
            })
            res.setHeader('Content-Type', 'text/html');
            
            res.render('result', {amount_in_rupees:amount_in_rupees, amount_in_dollar:amount_in_dollar,metrics:metrics,
              rate:rate, date:date, time:time});
          })
          .catch(err => res.send(err));
  }
});

app.post("/send_email", (req, res) => {
 
  to_email = req.body.email_id;
  const mailgun = require("mailgun-js");
  const DOMAIN = process.env.DOMAIN;
  const API_KEY = process.env.API_KEY;
  const mg = mailgun({apiKey: API_KEY, domain: DOMAIN});
  // let INR_amount_csv = path.join(__dirname, 'label_blind.csv');
  let output_csv = path.join(__dirname, 'output.csv')
  let metrics_csv = path.join(__dirname, 'metrics.csv');
  // console.log(USD_amount_csv)

  const data = {
      from: 'Ankit Tiwari <me@samples.mailgun.org>',
      to: to_email,
      subject: 'Results of Price Amount INR to USD Conversion',
      attachment: [output_csv,metrics_csv],
      text: 'Thanks for using our Currency Convertor Platform \nPlease find the attachment of your uploaded csv(INR) and corresponding results!!'
  };
  mg.messages().send(data, function (error, body) {
    console.log(body);

      if(error) {
        console.log('hi')
        res.render('email_sent', {msg: 'Something Went Wrong'});

      } else {
        res.render('email_sent', {msg:'Email Sent Successfully'})

      }
  });
  // res.send('Email')
  // res.redirect('/index.html')
  // msg = 'Email Sent Successfully'
  
  
})
app.listen(port, () => console.log('Server is running'));