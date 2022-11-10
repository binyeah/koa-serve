const Koa = require("koa2") // 引入koa2
// const app = new Koa() // 声明一个实例
const router = require("./router") // 配置路由
const cors = require("koa2-cors") // 解决跨域
const static = require("koa-static") // 静态资源管理
const path = require("path")
const websocket = require('koa-websocket')
const bodyParser = require('koa-bodyparser')

const app = websocket(new Koa())
app.use(bodyParser())


const os=require("os");
// 获取本机的ip
function getIpAddress() {
    const interfaces=os.networkInterfaces() 
  for (let dev in interfaces) {
    let iface = interfaces[dev] 
    for (let i = 0; i < iface.length; i++) {
      let {family, address, internal} = iface[i] 
      if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
        return address       
      }
    }
   }
 }
const ipAddress = getIpAddress()

let wsObj = {}

// 监听koa/ws路由，是否有连接
router.all('/koa/ws', (ctx) => {
  // 客户端链接传过来的客户端身份
  const { id } = ctx.query
  // 将链接保存起来
  wsObj[id] = ctx;
  // 给客户端发送链接成功信息
  // ctx.websocket.send('连接成功');
  // 监听客户端发送过来的信息
  ctx.websocket.on('message', function(message) {
      // console.log(JSON.parse(message));
      // uid为接收方，将接收到的信息发送给接收方uid,可以根据自己的需求处理数据再发送
      // const uid = JSON.parse(message).uId;
      const { mId = '', mName = '', uId = '', content = ''} = JSON.parse(message)
      if(!wsObj[uId]){
        // const data = {
        //   content:`${uId}未上线`,
        //   mId,
        // }
        // ctx.websocket.send(JSON.stringify(data))
        // wsObj[uId].unReadMsg && wsObj[uId].unReadMsg.length ? wsObj[uId].unReadMsg = [] : wsObj[uId].unReadMsg.push(content)
      }else{
        const data = {
          content,
          uId:mId,
          // unReadMsg: wsObj[uId].unReadMsg || [],
          uName:mName
        }
        wsObj[uId].websocket.send(JSON.stringify(data))
      }
      
  });
})

app.use(static(path.join(__dirname + "/public"))) //读取静态资源
app.use(cors()) //后端允许跨域访问
app.ws.use(router.routes())
app.use(router.routes(), router.allowedMethods())

const port = 3000 // 端口号
app.listen(port, () => {
  console.log(`服务启动成功：${ipAddress}:${port}`)
  router.get('/', async (ctx, next) => {
      ctx.body = `服务启动成功：${ipAddress}:${port}`
  })
})