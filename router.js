const Router = require('koa-router')
const router = new Router()
const DB = require('./mongodb');

// 登录/注册
router.get('/login', async (ctx, next) => {
  // console.log(ctx.query);
  const { username, password } = ctx.query
  const userList = await DB.find('userList', {})
  // console.log(userList);
  const isfind = userList.find(v => v.username == username)
  if (isfind && isfind.password!=password) {
    ctx.body = {
      code: 100,
      message: '用户名或密码错误',
      data: ''
    }
    return
  }
  const resData = {
    username, 
    id: isfind ? isfind.id : `${Math.random().toString(36).substring(2)}-${new Date().getTime().toString().substring(8)}`
  }
  ctx.body = {
    code: 200,
    message: '登录成功',
    data: resData
  }
  if (!isfind) {
    const newUser = {
      ...resData,
      password,
      friendList: []
    }
    // userList.push(resData)
    await DB.insert('userList', newUser)
    // console.log(result);
  }
})
// 获取好友列表
router.get('/getFriendList', async (ctx, next) => {
  const { id } = ctx.query
  const userInfo = await DB.find('userList', {id})
  const { friendList = [] } = userInfo[0] || {}
  // const resList = friendList.filter(v => v.status == 2)
  ctx.body = {
    code: 200,
    message: 'success',
    data: friendList
  }
})

// 搜索用户
router.get('/getUserList', async (ctx, next) => {
  const { username } = ctx.query
  const userList = username ? await DB.find('userList', {username}) : []
  ctx.body = {
    code: 200,
    message: 'success',
    data: userList
  }
})

// 添加好友
router.post('/addFriend', async (ctx, next) => {
  try {
    // status 0，申请，1，拒绝，2，同意
    const { id, friendId, status } = ctx.request.body
    const myInfo = await DB.find('userList', {id})
    const friendInfo = await DB.find('userList', {id:friendId})
    const data = {
      username: friendInfo[0].username,
      id: friendInfo[0].id,
      status,
      poster: 0
    }
    const friendList = JSON.parse(JSON.stringify(myInfo[0].friendList))
    // console.log(myInfo[0].friendList);
    const isAdded = friendList.findIndex(v => v.id === friendInfo[0].id)
    if (isAdded == -1) {
      friendList.unshift(data)
    } else {
      friendList.splice(isAdded,1,data)
    }
    // console.log(isAdded,friendList);
    await DB.update('userList', {id:myInfo[0].id}, {...myInfo[0],friendList})
    const data1 = {
      username: myInfo[0].username,
      id: myInfo[0].id,
      status,
      poster: 1
    }
    const newFriendInfo = JSON.parse(JSON.stringify(friendInfo[0].friendList))
    const friendIsAdded = newFriendInfo.findIndex(v => v.id === myInfo[0].id)
    if (friendIsAdded == -1) {
      newFriendInfo.unshift(data1)
    } else {
      newFriendInfo.splice(friendIsAdded,1,data1)
    }
    // console.log(newFriendInfo);
    await DB.update('userList', {id:friendInfo[0].id}, {...friendInfo[0],friendList:newFriendInfo})
    ctx.body = {
      code: 200,
      message: 'success',
      data: 'success'
    }
  } catch (error) {
    console.log(error);
    ctx.body = {
      code: 100,
      message: 'fail',
      data: error
    }
  }
})

// 删除好友
router.post('/deleteFriend', async (ctx, next) => {
  try {
    const { id, friendId } = ctx.request.body
    const myInfo = await DB.find('userList', {id})
    const friendInfo = await DB.find('userList', {id:friendId})

    const i = myInfo[0].friendList.findIndex(v => v.id == friendId)
    const friendList = JSON.parse(JSON.stringify(myInfo[0].friendList))
    friendList.splice(i,1)
    await DB.update('userList', {id:myInfo[0].id}, {...myInfo[0],friendList})

    const index = friendInfo[0].friendList.findIndex(v => v.id == id)
    const newfriendList = JSON.parse(JSON.stringify(friendInfo[0].friendList))
    newfriendList.splice(index,1)
    await DB.update('userList', {id:friendInfo[0].id}, {...friendInfo[0],friendList:newfriendList})
    ctx.body = {
      code: 200,
      message: 'success',
      data: 'success'
    }
  } catch (error) {
    console.log(error);
    ctx.body = {
      code: 100,
      message: 'fail',
      data: error
    }
  }
})

// 注销
router.post('/writeOff', async (ctx, next) => {
  const { id } = ctx.request.body
  // console.log(ctx.request.body, userList);
  const userList = await DB.find('userList', {})
  const isfind = userList.find(v => v.id == id)
  if (isfind) {
    await DB.delete('userList', isfind)
    ctx.body = {
      code: 200,
      message: '注销成功',
      data: 'success'
    }
    return
  }
  ctx.body = {
    code: 100,
    message: '操作异常',
    data: ''
  }
})
// router.post('/audit/menu/index', async (ctx, next) => {
//   ctx.body = require('./api/base/menu')
// })
// 导出 router 实例
module.exports = router