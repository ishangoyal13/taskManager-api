const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = mongoose.Schema({
  name : {
    type : String,
    trim : true,
    required : true
  },
  password : {
    type : String,
    required : true,
    trim : true,
    minlength : 7,
    validate(value) {
      if(validator.equals(value,'password')) {
        throw new Error('can \'t set password string as password !! ')
      }
    }
  },
  email : {
    type : String,
    required : true,
    trim : true,
    unique : true, 
    lowercase : true,
    validate(value) {
      if(!validator.isEmail(value))
        throw new Error('Email is not valid')
    }
  },
  age : {
    type: Number,
    default : 0,
    validate(value) {
        if(value < 0)
          throw new Error('Age can not be negative')
    }
  },
  tokens : [{
    token : {
      type : String,
      required : true
    },
  }],
  avatar : {
    type : Buffer
  }
},
{
  timestamps : true
})

// user task relationship
userSchema.virtual('tasks', {
  ref : 'Task',
  localField : '_id',   // field in that database
  foreignField : 'owner'    // field name in other database related to local field
})

userSchema.methods.toJSON = function () { 
  const user = this
  const userObject = user.toObject()    // toObject method provided by mongoose
  delete userObject.password    // json object mei password del krdo
  delete userObject.tokens      // json object mei tokens property del krdo
  delete userObject.avatar
  return userObject             // return modified object i.e without pass & tokens property
}

// generating auth token
userSchema.methods.generateAuthToken = async function() {
  const user = this 
  const token = jwt.sign({_id : user.id.toString()},'thisismytoken')
  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

// login authentication 
userSchema.statics.findByCredentials = async (email,password) => {
  const user = await User.findOne( { email })
  if(!user)
    throw new Error('No account linked with that email found !')
  
  const isMatch = await bcrypt.compare(password,user.password)
  if(!isMatch) {
    throw new Error('Password didn\'t matched')
  }
  return user
}

// hashing the password
userSchema.pre('save', async function(next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password,8)

  }
  next()
})

// delete user tasks when user is deleted
userSchema.pre('remove',async function(next) {
  const user = this
  await Task.deleteMany({owner : user._id})
  next()
})

const User = mongoose.model('User', userSchema)
module.exports = User