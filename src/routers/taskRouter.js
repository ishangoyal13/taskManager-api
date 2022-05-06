const express = require('express')
const router = express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

router.post('/tasks',auth,async (req,res) => {
  //const task = new Task(req.body)
  const task = new Task({
    ...req.body,
    owner : req.user._id
  })
  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
  /*task.save().then(()=> {
    res.status(202).send(task)
  }).catch((e)=> {
    res.status(400).send(e)
  })*/
})

// GET /tasks?limit=10&skip=0    // pagination limit
// GET /tasks/sortby              // sorting the data
router.get('/tasks',auth ,async (req,res) => {
  const match = {}
  const sort = {}
  if(req.query.completed) {
    match.completed = req.query.completed === 'true'
  }
  if(req.query.sortBy) {
    const parts = req.query.sortBy.split(':')  //can be _ also
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1   // converting desc and aesc string to number
  }
  try {
    //const task = await Task.find({})
    await req.user.populate({
      path : 'tasks',
      match,
      options : {
        limit: parseInt(req.query.limit),
        skip : parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.send(req.user.tasks)
  } catch (e) {
    res.status(500).send(e)
  }
  /* Task.find({}).then( (task) => {
    res.send(task)
  }).catch( (e) => {
    res.status(500).send()
  }) */
})

router.get('/tasks/:id',auth ,async (req,res) => {
  const _id = req.params.id 
  try {
    // const tasks = await Task.findById(_id)
    const tasks = await Task.findOne( { _id , owner : req.user._id } )
    if(!tasks)
      return res.status(404).send()
    res.send(tasks)
  } catch (e) {
    res.status(500).send()
  }
  /* Task.findById(_id).then((task) => {
    if(!task) {
      return res.status(404).send()
    }
    res.send(task)
  }).catch((e) => {
    res.status(500).send()
  }) */
})

// updating task completion status
router.patch('/tasks/:id',auth, async (req,res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = [ 'completed' ]
  const isValid = updates.every( (update) => {
    return allowedUpdates.includes(update)
  })
  if (!isValid) {
    return res.status(400).send({ error : 'Invalid updates !' })
  }

  try {
    //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new : true,runValidators:true})
    //const task = await Task.findById(req.params.id)
    const task = await Task.findOne( {
      _id : req.params.id,
      owner : req.user._id
    })
    if(!task) {
      return res.status(404).send()
    }
    updates.forEach((update) => task[update] = req.body[update])
    await task.save()
    res.send(task)
  } catch (e) {
    res.status(500).send()
  }
})

// -->  delete a task
router.delete('/tasks/:id', auth , async (req,res) => {
  try {
    //const task = await Task.findByIdAndDelete( req.params.id )
    const task = await Task.findOneAndDelete({
      _id : req.params.id,
      owner : req.user._id
    })
    if(!task)
      return res.status(404).send()
    res.send('Successfully deleted the task with id : '+ req.params.id)
  } catch (e) {
    res.status(500).send()
  }
})

module.exports = router