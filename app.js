const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const databasePath = path.join(__dirname, 'userData.db')

const app = express()

app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

// api 1 request user add into data base
app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body
  let hashPassword = await bcrypt.hash(password, 10)
  let get_date = `SELECT * FROM user WHERE username = '${username}';`
  let dbUser = await db.get(get_date)
  if (dbUser === undefined) {
    let createUser = `INSERT INTO user(username,name,password,gender,location)
    VALUES ('${username}','${name}','${hashPassword}','${gender}','${location}')`

    if (password.length < 5) {
      response.status(400)
      response.send(`Password is too short`)
    } else {
      let updated_values = await db.run(createUser)
      response.status(200)
      response.send(`User created successfully`)
    }
  } else {
    response.status(400)
    response.send(`User already exists`)
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(userQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send(`Invalid user`)
  } else {
    const passwordCompare = bcrypt.compare(password, dbUser.password)
    if (passwordCompare === true) {
      response.send(`Login success!`)
    } else {
      response.status(400)
      response.send(`Invalid password`)
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const userdata_user = `SELECT * FROM user WHERE username = '${username}';`
  const response_data = db.get(userdata_user)

  if (response_data === undefined) {
    response.status(400)
    response.send(`User not registered`)
  } else {
    const validPassword = await bcrypt.compare(
      oldPassword,
      response_data.password,
    )
    if (validPassword === true) {
      const lengthOfnewpassword = newPassword.length
      if (lengthOfnewpassword < 5) {
        response.status(400)
        response.send(`Password is too short`)
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10)
        const updateQuary = `UPDATE user
        SET 
        password = '${encryptPassword}'
        WHERE username = '${username}';`
        await db.run(updateQuary)
        response.send(`Password updated`)
      }
    } else {
      response.status(400)
      response.send(`Invalid current password`)
    }
  }
})
module.exports = app
