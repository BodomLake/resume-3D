# BodomLake's Portfolio
为了做个漂亮的简历，又苦于无法证明自己学过Web3D技术，于是就找来了这一项目，自己修改并且浏览了整个项目；觉得吸收完毕了，就把他改为自己的个人简历的项目了。

[src/app.js](/src/app.js)的流程每一句都看过了，主要还是 Ammojs和Threejs的交互值得当前的我学习，关于物理引擎，之前只看《ThreeJS开发指南》介绍的Physi.js,由于自己并不是专注于3Dweb开发，所以也就没有细看了。

在Floyd的项目中，我看到了Ammo.btTransform()对Threejs Mesh的影响，通过调制参数，看到了不同程度的碰撞效果。

在裁减了相当一部分的图片之后，缩小了尺寸和大小，这样我就可以从低带宽的服务器上拉取资源并且运行该项目了；
<!-- Try it out! [https://www.ryan-floyd.com/](https://www.ryan-floyd.com/) -->

对此我也写好了博客讲解代码 [resume-3D 三维的个人简历网站](https://www.cnblogs.com/noxus/p/16718877.html)

![alt text](/ryan_floyd_portfolio_gif.gif)

## 动机

发现了 Ryan Floyd的作品后，为了省事，直接用这个做了简历；也通篇看了他写的代码，受益匪浅；

## Features

- Physics engine (Ammo.js) combined with 3D rendered objects (Three.js) for real-time movement, collision detection and interaction
- 3D 实时渲染框架(Ammon.js)驱动下的3D物体
- Desktop and Mobile Responsiveness with both keyboard and touch screen controls
- 可以在PC或者移动端的浏览器上，操作（键盘和操作杆）
- Raycasting with event listeners for user touch and click interaction
- 3D物体可以通过射线和手指交互
- Asset compression with webpack plugin to help with quick site load times
- 我们用了 compression插件在webpack中帮助我们 快速构建网站资源

## 技术栈

- Three.js (3D Graphics)
- Ammo.js (Bullet Physics)
- HTML/CSS/JavaScript/GLSL
- Node.js
- Express (Node.js framework as server)
- Webpack (web program bundler)

## 使用

安装了依赖，可以用webpack的开发模式，或者webpack构建的静态资源，用express服务器做输出
```javascript
安装依赖 
npm install
webpack-dev-server热更新开发
npm run dev
webpack 打包
npm run build
express 输出静态资源 
npm run serve
```

## License

The project is licensed under the MIT License.
