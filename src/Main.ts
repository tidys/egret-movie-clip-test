//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class Main extends egret.DisplayObjectContainer {
  public constructor() {
    super();
    this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
  }

  private onAddToStage(event: egret.Event) {
    egret.lifecycle.addLifecycleListener((context) => {
      // custom lifecycle plugin

      context.onUpdate = () => { };
    });

    egret.lifecycle.onPause = () => {
      egret.ticker.pause();
    };

    egret.lifecycle.onResume = () => {
      egret.ticker.resume();
    };

    this.runGame().catch((e) => {
      console.log(e);
    });
  }

  private async runGame() {
    await this.loadResource();
    this.createGameScene();
    const result = await RES.getResAsync("description_json");
  }

  private async loadResource() {
    try {
      const loadingView = new LoadingUI();
      this.stage.addChild(loadingView);
      await RES.loadConfig("resource/default.res.json", "resource/");
      await RES.loadGroup("preload", 0, loadingView);
      this.stage.removeChild(loadingView);
    } catch (e) {
      console.error(e);
    }
  }

  private textfield: egret.TextField;
  private async readText(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const { target } = event;
        if (target) {
          const data = (target as FileReader).result;
          resolve(data as string);
        }
      };
      reader.readAsText(file);
    });
  }
  private async readArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const { target } = event;
        if (target) {
          const data = (target as FileReader).result;
          resolve(data as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
  private async dealFileList(files: FileList, cb: Function) {
    if (files.length < 1) {
      return;
    }
    if (files.length !== 2) {
      alert("需要2个文件(*.json/*.png)");
      return;
    }
    let jsonData = "";
    let textureData: ArrayBuffer | null = null;
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if ((item.name as any).endsWith(".json")) {
        jsonData = await this.readText(item);
      } else {
        textureData = await this.readArrayBuffer(item);
      }
    }
    if (jsonData && textureData) {
      cb && cb(jsonData, textureData);
    }
  }
  private upload(cb: any) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*, application/json";
    fileInput.addEventListener("change", async () => {
      await this.dealFileList(fileInput.files, cb);
    });
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }
  private initLabel() {
    let textfield = new egret.TextField();
    this.addChild(textfield);
    textfield.width = this.stage.stageWidth;
    textfield.textAlign = egret.HorizontalAlign.CENTER;
    textfield.size = 24;
    textfield.textColor = 0xffffff;
    textfield.x = 0; //this.stage.stageWidth / 2;
    textfield.y = 30; //this.stage.stageHeight/2;
    textfield.text = "点击任意位置上传MovieClip(*.json/*.png)";
    // textfield.anchorOffsetX = textfield.height / 2;
    // textfield.anchorOffsetY = textfield.width / 2;
    this.textfield = textfield;
  }
  private resize() {
    const { clientWidth, clientHeight } = document.body;
    this.stage.setContentSize(clientWidth, clientHeight);
  }
  private ondrag() {
    const canvas: HTMLCanvasElement = this.stage.$screen['canvas'];
    canvas.draggable = false;
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dealFileList(e.dataTransfer.files, this.createMc.bind(this));
    })
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    })
    canvas.addEventListener('dragenter', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    canvas.addEventListener('dragleave', (e) => {
      e.preventDefault()
      e.stopPropagation()
    });
  }
  /**
   * 创建游戏场景
   * Create a game scene
   */
  private createGameScene() {
    this.stage.scaleMode = egret.StageScaleMode.SHOW_ALL;
    this.resize()
    window.addEventListener('resize', () => {
      this.resize()
    });
    this.ondrag();
    // this.initLabel();
    // https://egret-docs.pages.dev/movieClip
    let preX = 0, preY = 0;
    this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      preX = e.stageX;
      preY = e.stageY;
    }, this);
    this.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, (e: egret.TouchEvent) => {
      // console.log(e.stageX, e.stageY);
      let diffX = e.stageX - preX;
      let diffY = e.stageY - preY;
      if (this.mc1) {
        this.mc1.x += diffX;
        this.mc1.y += diffY;
      }
      preX = e.stageX;
      preY = e.stageY;
    }, this);
    document.body.addEventListener('wheel', (e: WheelEvent) => {
      if (this.mc1) {
        let scale = this.mc1.scaleX - e.deltaY * 0.001;
        scale = Math.max(scale, 0.1);
        this.mc1.scaleX = scale;
        this.mc1.scaleY = scale;
      }
    })

    this.createList([
      {
        name: 'default movie clip', cb: () => {
          this.loadDefaultMc();
        }
      },
      {
        name: 'upload movie clip', cb: () => {
          this.upload(this.createMc.bind(this));
        }
      },
      {
        name: 'reset movie clip', cb: () => {
          if (this.mc1) {
            this.mc1.scaleX = this.mc1.scaleY = 1;
            this.mc1.x = this.stage.stageWidth / 2;
            this.mc1.y = this.stage.stageHeight / 2;
          }
        }
      }
    ])
    this.loadDefaultMc()
  }
  private createMc(json: string, buffer: ArrayBuffer) {
    egret.BitmapData.create("arraybuffer", buffer, (bitmap) => {
      const texture = new egret.Texture();
      texture._setBitmapData(bitmap);
      this.loadMc(JSON.parse(json), texture);
    });
  }
  private loadDefaultMc() {
    const data = RES.getRes("82_json");
    const texture = RES.getRes("82_png");
    this.loadMc(data, texture);
  }
  private getRandomColor(): number {
    let red: number = Math.floor(Math.random() * 256);
    let green: number = Math.floor(Math.random() * 256);
    let blue: number = Math.floor(Math.random() * 256);
    return (red << 16) | (green << 8) | blue;
  }
  private createList(list: Array<{ name: string, cb: (e: egret.TouchEvent) => void }>) {
    let y = 0;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const btn = new egret.TextField();
      btn.text = item.name;
      btn.touchEnabled = true
      btn.addEventListener(egret.TouchEvent.TOUCH_TAP, (e: egret.TouchEvent) => {
        btn.textColor = this.getRandomColor();
        item.cb(e);
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
      }, this)
      btn.$anchorOffsetX = 1;
      btn.y = y;
      y += btn.height;
      this.stage.addChild(btn);
    }
  }
  private mc1: egret.MovieClip;
  private loadMc(data: any, texture: egret.Texture) {
    if (this.mc1) {
      this.removeChild(this.mc1);
      this.mc1 = null;
    }
    const animations = Object.keys(data.mc);
    const mcFactory: egret.MovieClipDataFactory = new egret.MovieClipDataFactory(data, texture);
    const mc1: egret.MovieClip = new egret.MovieClip(mcFactory.generateMovieClipData(animations[0]));
    mc1.x = this.stage.stageWidth / 2;
    mc1.y = this.stage.stageHeight / 2;
    mc1.play(-1);
    const scale1 = this.stage.stageWidth / mc1.width;
    const scale2 = this.stage.stageHeight / mc1.height;
    const scale = Math.min(scale1, scale2);
    mc1.scaleX = scale;
    mc1.scaleY = scale;
    this.addChild(mc1);
    this.mc1 = mc1;
  }
  /**
   * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
   * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
   */
  private createBitmapByName(name: string) {
    let result = new egret.Bitmap();
    let texture: egret.Texture = RES.getRes(name);
    result.texture = texture;
    return result;
  }
}
