const express = require('express')
const router = express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')

// creating a user
router.post('/users',async (req,res) => {
  const user = new User(req.body)
  /*
  user.save().then(()=> {
      res.send(user)
  }).catch((e) => {
    res.send(e)
  }) */
  try {
    await user.save()
    const token = await user.generateAuthToken()
    res.status(201).send({user,token})
  } catch (e) {
    res.status(400).send(e)
  }
})

// credential find 
router.post('/users/login',async (req,res) => {
  try {
    const user = await User.findByCredentials(req.body.email , req.body.password)
    const token = await user.generateAuthToken()
    res.send({user , token})
  }
  catch (e) {
    res.status(400).send()
  }
})

// logout
router.post('/users/logout', auth , async (req,res) => {
  try { 
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// log out all
router.post('/users/logoutall' , auth , async (req,res) => {
  try {
    req.user.tokens = [] 
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// get list of all users
router.get('/users/me', auth ,async (req,res) => {

  res.send(req.user)
  // try {
  //   const users = await User.find({})
  //   res.send(users)
  // } catch (e) {
  //   res.status(500).send(e)
  // }

  /* User.find({}).then((user) => {
    res.send(user)
  }).catch((e) => {
    res.status(500).send()
  }) */
})



// updating the user
router.patch('/users/me', auth , async(req,res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name','email','password','age']
  const isValid = updates.every( (update) => {
    return allowedUpdates.includes(update)
  })
  if (!isValid) {
    return res.status(400).send({ error : 'Invalid updates !' })
  }

  try {
    //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new : true,runValidators:true})
    // const user = await User.findById(req.params.id)
    // if(!user) {
      //   return res.status(404).send()
      // }
    updates.forEach((update) => req.user[update] = req.body[update])
    await req.user.save()
    res.send(req.user)

  } catch (e) {
    res.status(500).send()
  }
})

// deleting the user
router.delete('/users/me' , auth , async (req,res) => {
  try {
    // const user = await User.findByIdAndDelete( req.user._id )
    // if(!user)
    //   return res.status(404).send()
    await req.user.remove()
    res.send(req.user)
  } catch (e) {
    res.send(500).send()
  }
})

const upload = multer({
  limits : {
    fileSize : 1000000      // restricting size to 1 mb
  },
  fileFilter(req,file,cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('pls upload an image'))
    }
    cb(undefined,true)
  }
})
router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res) => {
  const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error,req,res,next) => {
  res.status(404).send({error : error.message})
})

router.delete('/users/me/avatar',auth,async (req,res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})
router.get('/users/:id/avatar' , async (req,res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user || !user.avatar) {
      throw new Error()
    }
    res.set('Content-Type','image/png')
    res.send(user.avatar)
  } catch (e) {
    res.status(404).send()
  }
})

module.exports = router


/* -------------------------------- */
/* getting user by a particular id */
/*
router.get('/users/:id',async (req,res) => {
  const _id = req.params.id 

  try {
    const user = await User.findById(_id)
    if(!user)
      return res.status(404).send()
    res.send(user)
  } catch (e) {
    res.status(500).send()
  }

  /* User.findById(_id).then( (user) => {
    if(!user) {
      return res.status(404).send()
    }
    res.send(user)
  }).catch( (e) => {
    res.status(500).send()
  }) */
/* }) */
