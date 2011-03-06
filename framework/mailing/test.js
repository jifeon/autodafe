var email = require("./node_mailer/lib/node_mailer");

email.send({
  host : "localhost",              // smtp server hostname
  port : "25",                     // smtp server port
  domain : "localhost",            // domain used by client to identify itself to server
  to : "bvlvl2003@rambler.ru",
  from : "obama@whitehouse.gov",
  subject : "node_mailer test email",
  body: "Hello! This is a test of the node_mailer."//,
//  authentication : "login",        // auth login is supported; anything else is no auth
//  username : "dXNlcm5hbWU=",       // Base64 encoded username
//  password : "cGFzc3dvcmQ="       // Base64 encoded password
},
function(err, result){
  if(err){ console.log(err); }
});