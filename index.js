const express = require('express')
const bodyParser = require('body-parser');
const fs = require("fs");
const md5 = require('md5');
const ReverseMd5 = require('reverse-md5');
const jwt = require("jsonwebtoken");
const { use } = require('express/lib/application');
const app = express()
const port = 5000
const rev = ReverseMd5({
    lettersUpper: false,
    lettersLower: true,
    numbers: true,
    special: false,
    whitespace: true,
    maxLen: 12
})

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.PORT || port);

const file = fs.existsSync("./data.json")?fs.readFileSync("./data.json"):"";
const data = file?JSON.parse(file):{};


app.post('/signup', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let fname = req.body.fname;
    let lname = req.body.lname;
    
    if (!username && !password && !fname && !lname)
    {
        res.status(400).json({ result: false, error:"fields can't be empty"});
    }
    else if (username && !password && !fname && !lname)
    {
        res.status(400).json({ result: false, error: "fields can't be empty" });
    }
    else if (!username && password && !fname && !lname) 
    {
        res.status(400).json({ result: false, error: "fields can't be empty" });
    }
    else if (!username && !password && fname && !lname) 
    {
        res.status(400).json({ result: false, error: "fields can't be empty" });
    }
    else if (!username && !password && !fname && lname) 
    {
        res.status(400).json({ result: false, error: "fields can't be empty" });
    }
    else
    {
        if (username.length < 4 || /^[a-z]+$/.test(username) ==false)
        {
            res.status(400).json({ result: false, error: "username check failed" });
        }
        else if (/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/.test(password) == false) 
        {
            res.status(400).json({ result: false, error: "password check failed" });
        }
        else if (/^[A-Za-z]+$/.test(fname) == false) 
        {
            res.status(400).json({ result: false, error: "fname or lname check failed" });
        }
        else if (/^[A-Za-z]+$/.test(lname) == false) 
        {
            res.status(400).json({ result: false, error: "fname or lname check failed" });
        }
        else if (data[username]) 
        {
            res.status(400).json({ result: false, error: "username already exists" });
        }
        else
        {
            data[username] = {
                fname: fname,
                lname: lname,
                password: md5(password),
            };
            fs.writeFileSync('./data.json',JSON.stringify(data))
            res.status(201).json({ result: true, message: "SignUp success. Please proceed to Signin" });
        }
    }
})

app.post('/signin',(req,res)=>{

    let username = req.body.username;
    let password = req.body.password;

    if(!username && !password)
    {
        res.status(400).json({ result: false, error: "Please provide username and password" });
    }
    else if (username && !password) 
    {
        res.status(400).json({ result: false, error: "Please provide username and password" });
    }
    else if (!username && password)
    {
        res.status(400).json({ result: false, error: "Please provide username and password" });
    }
    else
    {
        if(!data[username])
        {
            res.status(401).json({ result: false, error: "Invalid username/password" });
        }
        else if(data[username] && data[username].password != md5(password))
        {
            res.status(401).json({ result: false, error: "Invalid username/password" });
        }
        else
        {
            let token = jwt.sign(
                { username: username, fname:data[username].fname },
                username+''+data[username].fname,
                {
                    expiresIn: "2h",
                }
            );
            res.status(200).json({result:true,jwt:token,message:'Signin success'})
        }
    }
})

app.get('/user/me',(req,res)=>{
    let token = req.headers['authorization'];
    let key = Object.keys(data)[0];
    if (token) {
        token = token.replace('Bearer ', '');
        jwt.verify(token, key+''+data[key].fname, (err, decoded) => {
            if (err) {
                res.status(401).json({ result: false, error: "JWT Verification Failed" });
            }
            res.status(200).json({ result: true, data: data["shivam"] })
        });
    } else {
        res.status(401).json({ result: false, error: "Please provide a JWT token" });
    }
})