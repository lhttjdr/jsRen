/*  
基于jQuery，开发的jsRena插件。
*/
(function($, undefined){      
    $.extend($.fn, {
	jsRena : function(options) {
			var defualts = {
				prefix: "jsRena",
				mode: "default",
				data:"", //仅在Manual模式下有效
				isShowOrder: true,
				imagePath: 'images',
				runat:'offline',
				type:'Renlib'
			};
            var opts = $.extend(defualts, options);
			
            var fs=new FiveStone(opts, $(this));
			fs.initBoard();
        }  
    }); 

    var FiveStone = function(params, container) {
        this.container = container;
		this.prefix=params.prefix;
        this.moves = "";
        this.steps = 0;
        this.mode = params.mode;
        this.isShowOrder = params.isShowOrder;
        this.imagePath = params.imagePath;
        this.count = this.steps + 1;
        this.MS = new Array;
        this.MS[0] = "";
        this.bd = new Array(225);
        this.SS = new Array;
        this.alpha = "abcdefghijklmno";
		this.data=params.data;
		this.decode=null;
		this.type=params.type;
		this.manualPtr=0;
    }

    FiveStone.prototype = {
        initBoard: function() {
            var _this = this,
            board = $("<table>");
            board.attr({
                "id": this.prefix+"_board",
                "cellspacing": 0
            }).css({
				"background-image":"url("+this.imagePath+"/bg.jpg)",
				"padding":"17px 5px 5px 17px"
			});
            for (var j = 0; j < 15; ++j) {
                var tr = $("<tr>");
                for (var i = 0; i < 15; ++i) {
                    var name = this.getPos(i, j);
                    this.bd[i * 15 + j] = '.';
                    var td = $("<td>"),
                    div = $("<div>"),
                    img = $("<img>"),
                    step = $("<div>");
                    div.css({
                        "position": "relative"
                    });
                    img.attr({
                        "src": this.getImage(i, j),
                        "id": this.prefix+"_"+name
                    }).css({
                        "border": "0px",
                        "width": "25px"
                    }).bind("mouseout",
                    function(e) {
						if(_this.mode!="default")return;
						var m=e.target.id.split('_');
                        _this.MouseOut(m[m.length-1]);
                    }).bind("mouseover",
                    function(e) {
						if(_this.mode!="default")return;
						var m=e.target.id.split('_');
                        _this.MouseOver(m[m.length-1]);
                    }).bind("click",
                    function(e) {
						if(_this.mode=="readonly"){
							_this.forward();
						}else if(_this.mode=="manual"){
							var m=e.target.id.split('_');
							_this.ManualForward(m[m.length-1]);					
						}else{
							var m=e.target.id.split('_');
							_this.Click(m[m.length-1]);
						}
                    }).bind('contextmenu',function(e){ 
						if(_this.mode=="manual"){
							return _this.ManualBackward();
						}else{
							return _this.back();
						}
					});
                    step.attr("id", this.prefix+"_text_"+name).bind("contextmenu",function() {
						if(_this.mode=="manual"){
							return _this.ManualBackward();
						}else{
							return _this.back();
						}
                    }).bind("click",function(e) {
						if(_this.mode=="readonly"){
							_this.forward();
						}else if(_this.mode=="manual"){
							var m=e.target.id.split('_');
							_this.ManualForward(m[m.length-1]);					
						}else{
							var m=e.target.id.split('_');
							_this.Click(m[m.length-1]);
						}
                    });
                    div.append(img).append(step);
                    td.css({
                        "padding": "0px",
                        "maigin": "0px",
                        "border": "0px"
                    }).append(div).appendTo(tr);
                }
                var Col = $("<td>"),
                span = $("<span>").css({
                    "fontFamily": "宋体",
                    "fontSize": "12px",
                    "color": "#000066"
                }).html(15 - j);
                Col.append(span).appendTo(tr);
                tr.appendTo(board);
            }
            var Row = $("<tr>");
            Row.attr("align", "center");
            for (i = 0; i < 15; i++) {
                var td = $("<td>"),
                span = $("<span>");
                span.css({
                    "font-family": "Arial",
                    "font-size": "12px",
                    "color": "#000066"
                }).html(this.alpha.charAt(i)).appendTo(td);
                td.appendTo(Row);
            }
            Row.appendTo(board);

            var toolBar = $("<div>");
			
			if(this.mode!="manual"){
				var set = $("<input>").attr({
					"type": "button",
					"value": "落子",
					"id": this.prefix+"_set",
					"name": this.prefix+"_set"
				}).bind("click",
				function() {
					_this.showMoves($("#"+_this.prefix+"_moves").attr("value"));
				}).appendTo(toolBar);
			}
			
            var records = $("<input>").attr({
                "type": "text",
                "size": 700,
                "value": this.moves,
                "name": this.prefix+"_moves",
                "id": this.prefix+"_moves",
                "title": "双击复制棋谱"
            }).css({
                "width": "100pt"
            }).bind("dbclick",function() {
				return $("#"+this.prefix+"_copy").click();
            }).bind("keyup",function(e) {
                e.target.value = e.target.value.replace(/\s/g, '');
            }).bind("beforepaste",function() {
                clipboardData.setData('text', clipboardData.getData('text').replace(/\s/g, ''));
            });
			if(this.mode=="manual"){
				records.attr("readonly","readonly");
			}
			records.appendTo(toolBar);
			$("<span>").css({"fontFamily": "宋体","fontSize":"12px","color": "#000066"}).html("手数：").appendTo(toolBar);
            var steps = $("<input>").attr({
                "type": "text",
                "name": this.prefix+"_steps",
                "id": this.prefix+"_steps",
                "size": 3,
                "value": this.count
            });
			if(this.mode=="manual"){
				steps.attr("readonly","readonly");
			}
			steps.appendTo(toolBar);
            var IsShowSteps = $("<input>").attr({
                "type": "checkbox",
                "name": this.prefix+"_isShowSteps",
                "id": this.prefix+"_isShowSteps",
                "checked": _this.isShowOrder
            }).bind("click",function() {
                _this.isShowOrder = $("#"+_this.prefix+"_isShowSteps").is(":checked");
                for (i = 0; i < _this.MS.length; i++) {
                    if (_this.isShowOrder) _this.put(_this.MS[i], i);
                    else {
                        _this.isShowOrder = true;
                        _this.wt(_this.MS[i], i, "");
                        _this.isShowOrder = false;
                    }
                }
			}).appendTo(toolBar);
			$("<span>").css({"fontFamily": "宋体","fontSize":"12px","color": "#000066"}).html("是否显示手数").appendTo(toolBar);
			$("<br/>").appendTo(toolBar);
			if(this.mode!="manual"){
				var reset = $("<input>").attr({
					"type": "button",
					"width": "25pt",
					"value":"=",
					"title": "重置"
				}).bind("click",function() {
					_this.Reset();
					$("#"+_this.prefix+"_moves").value(_this.moves);
					$("#"+_this.prefix+"_steps").value(_this.steps);
				}).appendTo(toolBar);
			}
            var first = $("<input>").attr({
                "type": "button",
                "width": "25pt",
                "value": "<<",
                "title": "第一步"
            }).bind("click",function() {
				if(_this.mode!="manual"){
					var n = _this.MS.length + 1;
					for (var j = 0; j < n; j++) _this.back();
				}else{
					while(_this.manualPtr!=0)  _this.ManualBackward();
				}
            }).appendTo(toolBar);
            var prev = $("<input>").attr({
                "type": "button",
                "width": "25pt",
                "value": "<",
                "title": "上一步"
            }).bind("click",function() {
               	if(_this.mode!="manual"){
					_this.back();
				}else{
					_this.ManualBackward();
				}
            }).appendTo(toolBar);
            var succ = $("<input>").attr({
                "type": "button",
                "width": "25pt",
                "value": ">",
                "title": "下一步"
            }).bind("click",function() {
				if(_this.mode!="manual"){
					_this.forward();
				}else{
					_this.ManualForward("00");
				}
            }).appendTo(toolBar);
            var last = $("<input>").attr({
				"type": "button",
                "width": "25pt",
                "value": ">>",
                "title": "最末步"
            }).bind("click",function() {
				if(_this.mode!="manual"){
					while (_this.SS.length)	_this.forward();
				}else{
					while (_this.decode.tree[_this.manualPtr].sons.length!=0)
						_this.ManualForward("00");
				}
            }).appendTo(toolBar);
            var copy = $("<input>").attr({"type": "button", "name": this.prefix+"_copy", "id": this.prefix+"_copy", "value": "复制棋谱"
            }).bind("click",function(){
				return copy_clip($("#"+_this.prefix+"_moves").val());
			}).appendTo(toolBar);
			$("<br/>").appendTo(toolBar);
			$("<div>").attr({"name": this.prefix+"_comment", "id": this.prefix+"_comment"}).css({"fontFamily": "Arial,宋体","fontSize":"12px","color": "#000066","min-height":"30px"}).html("").appendTo(toolBar);

            this.container.append(board).append(toolBar);
            this.Reset();
			
			if(this.mode=="manual"){
				this.decode=RenaDecode(this.data,this.type);
				this.ManualAutoToStart(this.decode.start);
			}
        },
        getX: function(m) {
            return m.toLowerCase().charCodeAt() - 'a'.charCodeAt();
        },
        getY: function(m) {
            m = m.substr(1);
            return 15 - m;
        },
        getPos: function(a, b) {
            return (this.alpha.charAt(a) + (15 - b)).toLowerCase();
        },
        getImage: function(a, b) {
            var pre = a == 0 ? (b == 0 ? "tl": b == 14 ? "bl": "l") : a == 14 ? (b == 0 ? "tr": b == 14 ? "br": "r") : b == 0 ? "t": b == 14 ? "b": "";
            pre = pre != "" ? pre: (a == 11 || a == 3 || a == 7) ? (b == 11 || b == 3 || b == 7) ? "i": "": "";
            return pre == "" ? this.imagePath + "/empty.gif": this.imagePath + "/e" + pre + ".gif";
        },
        gio: function(a, b) {
            var pre = a == 0 ? (b == 0 ? "tl": b == 14 ? "bl": "l") : a == 14 ? (b == 0 ? "tr": b == 14 ? "br": "r") : b == 0 ? "t": b == 14 ? "b": "";
            pre = pre != "" ? pre: (a == 11 || a == 3 || a == 7) ? (b == 11 || b == 3 || b == 7) ? "i": "": "";
            return pre == "" ? this.imagePath + "/cur.gif": this.imagePath + "/c" + pre + ".gif";
        },
        MouseOver: function(m) {
            var a = this.getX(m),
            b = this.getY(m);
            if (this.bd[a * 15 + b] != '.') return;
            $("#"+this.prefix+"_board img" +"#"+this.prefix+"_"+m).attr("src", this.gio(a, b));
        },
        MouseOut: function(m) {
            var a = this.getX(m),
            b = this.getY(m);
            if (this.bd[a * 15 + b] != '.') return;
            $("#"+this.prefix+"_board img" +"#"+this.prefix+"_"+m).attr("src", this.getImage(a, b));
        },
        Click: function(m) {
            var a = this.getX(m),
            b = this.getY(m);
            var l = this.MS.length;
            if (this.bd[a * 15 + b] != '.') return;
            if (this.MS[l - 1] != 'pass') {
                if (this.MS[l - 1] != undefined) $("#"+this.prefix+"_text_" + this.MS[l - 1]).css("color", l % 2 ? 'white': 'black');
            }
            this.MS[l] = m;
            this.put(m, l);
            $("#"+this.prefix+"_moves").attr("value", this.getMoves());
            $("#"+this.prefix+"_steps").attr("value", this.MS.length);
        },
        put: function(m, i) {
            var img = i % 2 ? "w": "b";
            var text = i + 1;
            var sl = this.SS.length;
            if (sl) {
                if (this.SS[sl - 1] == m) {
                    this.SS.length = sl - 1;
                } else {
                    this.SS.length = 0;
                }
            }
            if (m == 'pass') {
                return;
            }
            $("#"+this.prefix+"_board img#"+this.prefix+"_"+ m).attr("src", this.imagePath + "/" + img + ".gif");
            this.bd[this.getX(m) * 15 + this.getY(m)] = img;
            this.wt(m, i, text);
        },
		GetStringLength:function(str) {
			var realLength = 0, len = str.length, charCode = -1;
			for (var i = 0; i < len; i++) {
				charCode = str.charCodeAt(i);
				if(charCode==0)continue;//bug?
				if (charCode >= 0 && charCode <= 128) realLength += 1;
				else realLength += 2;
			}
			return realLength;
		},
        wt: function(m, i, text) {
			var _this=this;
            if (!this.isShowOrder) return;
            if (m == 'pass') {
                return;
            }
            var p = $("#"+this.prefix+"_text_" + m);
            p.css({
                "fontFamily": 'Arial',
                'position': 'absolute',
				'cursor':'default'
            }).html(text).bind("click",function() {
                if(_this.mode=="default"){
					_this.Click(m);
				}
            });
            if (text == "") return;
			var width=this.GetStringLength(text.toString());
            p.css({
                "top": "4px",
                "left": (width > 1 ? width > 2 ? 2 : 5 : 9) + 'px',
                "fontSize": '9pt',
                "fontWeight": 'bold',
                "color": (i<0?'blue':(i == this.MS.length - 1 ? 'red': i % 2 ? 'black': 'white'))
            });
        },
        unpack: function() {
            this.MS.length = 0;
            var m = this.moves;
            while (m.length) {
                var a = m.substr(0, 2);
                m = m.substr(2);
                if (a == '--')
                {
                    this.MS[MS.length] = 'pass';
                } else {
                    var d = m.charCodeAt() - '0'.charCodeAt();
                    if (d >= 0 && d <= 9) {
                        a += m.substr(0, 1);
                        m = m.substr(1);
                    }
                    this.MS[this.MS.length] = a;
                }
            }
            this.count = this.MS.length;
        },
        back: function() {
            var l = this.MS.length;
            if (l <= 0) {
                return false;
            }
            var m = this.MS[l - 1];
            this.SS[this.SS.length] = m;
            if (m == 'pass') {
                this.MS.length--;
                this.back();
                return false;
            }
            var x = this.getX(m);
            var y = this.getY(m);
            $("#"+this.prefix+"_board img#"+this.prefix+"_" + m).attr("src", this.getImage(x, y));
            this.bd[x * 15 + y] = '.';
            this.wt(m, l, "");
            this.MS.length--;
            if (this.MS.length) this.wt(this.MS[l - 2], l - 2, l - 1);
            $("#"+this.prefix+"_moves").attr("value", this.getMoves());
            $("#"+this.prefix+"_steps").attr("value", this.MS.length);
			return false;
        },
		forward:function(){
			var ssl = this.SS.length;
            if (ssl) {
                var m = this.SS[ssl - 1];
				var a = this.getX(m),
				b = this.getY(m);
				var l = this.MS.length;
				if (this.bd[a * 15 + b] != '.') return;
				if (this.MS[l - 1] != 'pass') {
					if (this.MS[l - 1] != undefined) $("#"+this.prefix+"_text_" + this.MS[l - 1]).css("color", l % 2 ? 'white': 'black');
				}
				this.MS[l] = m;
				this.put(m, l);
				$("#"+this.prefix+"_moves").attr("value", this.getMoves());
				$("#"+this.prefix+"_steps").attr("value", this.MS.length);
            }
		},
        Reset: function() {
            while (this.MS.length > 1) {
                this.back();
                if (this.MS.length == 1) this.back();
            }
            this.unpack();
            for (i = 0; i < this.MS.length; i++)
				this.put(this.MS[i], i);
        },
        getMoves: function() {
            var ml = "";
            for (i = 0; i < this.MS.length; i++) ml = ml + this.MS[i];
            return ml;
        },
        showMoves: function(qp) {
            this.moves = qp;
            this.Reset();
			this.steps = this.count;
			$("#"+this.prefix+"_steps").attr("value", this.steps);
            $("#"+this.prefix+"_moves").attr("value", this.moves);
        },
		Pos2Board:function(pos){//RenLib坐标转换为棋盘坐标
			var a=Math.floor((parseInt(pos,16)-1)/16);
			var b=(parseInt(pos,16)-1)%16;
			return this.getPos(a,b);
		},
		ManualAutoToStart:function(start){
			var tree=this.decode.tree;
			var seq=this.decode.seq;
			//注释
			if((seq[tree[0].index].flag&8) || (seq[tree[0].index].flag&32)){
				$("#"+this.prefix+"_comment").html(seq[tree[0].index].comment);
			}
			//Rena棋盘文字列表
			if(this.type=="Rena" && (seq[tree[0].index].flag&4)){
				var renalist=seq[tree[0].index].RenaList;
				for(var e in renalist){
					var pos=renalist[e].pos;
					var text=renalist[e].text;
					this.wt(this.Pos2Board(pos), -1, text);//子节点棋盘文字
				}
			}
			//此处需要显示子节点的位置
			for(var e in tree[0].sons){
				var son=tree[tree[0].sons[e]];
				var pos=seq[son.index].pos;
				var text=seq[son.index].text;
				
				var a = parseInt((parseInt(pos,16)-1)/16),
				b = (parseInt(pos,16)-1)%16;
				if(!(seq[son.index].flag&2)){
					$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src", this.gio(a, b));
				}
				if(seq[son.index].flag&256){
					if(!(seq[son.index].flag&2)){
						var src=$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src");
						src=src.replace(/c([a-z]{1,2}\.gif)$/,"t$1");//替换为空心方框
						$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src",src);
					}
					this.wt(this.getPos(a,b), -1, text);//子节点棋盘文字
				}
			}
			this.manualPtr=0;
			var stack=new Array();
			var p=start;
			while(p){
				p=tree[p].parent;
				stack.push(this.Pos2Board(seq[tree[p].index].pos));
			}
			while(stack.length){
				this.ManualForward(stack.pop());
			}
		},
		ManualForward:function(m){
			var tree=this.decode.tree;
			var seq=this.decode.seq;
			var now=this.manualPtr;
			var a,b,m;
			//查找tree的目标索引
			var target=-1;
			if(seq[tree[now].index].flag&(1<<6)) return;//当前是叶子节点。		
			var mm=(this.getX(m)*16+this.getY(m)+1).toString(16);
			for(var e in tree[now].sons){
				var son=tree[tree[now].sons[e]];
				if(seq[son.index].pos==mm){
					target=tree[now].sons[e];
					break;
				}
			}
			if(target==-1){ //默认第一个分支
				target=tree[now].sons[0];
				mm=seq[tree[target].index].pos;
			}
			m=this.Pos2Board(mm);
			if(tree[target].parent!=-1){//非根节点
				//取消target兄弟节点的显示
				var t=tree[target].parent;
				for(var e in tree[t].sons){
					var son=tree[tree[t].sons[e]];
					var pos=seq[son.index].pos;

					var a = parseInt((parseInt(pos,16)-1)/16),
					b = (parseInt(pos,16)-1)%16;
					if(!(seq[son.index].flag&2)){//No chess标记的只有文字
						$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src", this.getImage(a, b));
					}
					if(seq[son.index].flag&256){//棋盘文字
						this.wt(this.getPos(a,b),-1,"");
					}
				}
				//清除Rena棋盘文字列表
				if(this.type=="Rena" && (seq[tree[t].index].flag&4)){
					var renalist=seq[tree[t].index].RenaList;
					for(var e in renalist){
						var pos=renalist[e].pos;
						this.wt(this.Pos2Board(pos), -1, "");//子节点棋盘文字
					}
				}
				//取消注释
				if(((seq[tree[t].index].flag&8) || (seq[tree[t].index].flag&32))){ //超级根节点默认没有注释
					$("#"+this.prefix+"_comment").html("");
				}
			}
			if(!(seq[tree[t].index].flag&2)){
				//显示目标处的棋子
				var l = this.MS.length;
				if (this.bd[a * 15 + b] != '.') return;
				if (this.MS[l - 1] != 'pass') {
					if (this.MS[l - 1] != undefined) $("#"+this.prefix+"_text_" + this.MS[l - 1]).css("color", l % 2 ? 'white': 'black');
				}
				this.MS[l] = m;
				this.put(m, l);
				$("#"+this.prefix+"_moves").attr("value", this.getMoves());
				$("#"+this.prefix+"_steps").attr("value", this.MS.length);
			}
			//注释
			if((seq[tree[target].index].flag&8) || (seq[tree[target].index].flag&32)){
				$("#"+this.prefix+"_comment").html(seq[tree[target].index].comment);
			}
			var sons=new Array();
			//此处需要显示子节点的位置
			for(var e in tree[target].sons){
				var son=tree[tree[target].sons[e]];
				var pos=seq[son.index].pos;
				var text=seq[son.index].text;
				sons.push(pos);
				var a = parseInt((parseInt(pos,16)-1)/16),
				b = (parseInt(pos,16)-1)%16;
				if(!(seq[son.index].flag&2)){
					$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src", this.gio(a, b));
				}
				if(seq[son.index].flag&256){
					if(!(seq[son.index].flag&2)){
						var src=$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src");
						src=src.replace(/c([a-z]{1,2}\.gif)$/,"t$1");//替换为空心方框
						$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src",src);
					}
					this.wt(this.getPos(a,b), -1, text);//子节点棋盘文字
				}
			}
			//Rena棋盘文字列表
			if(this.type=="Rena" && (seq[tree[target].index].flag&4)){
				var renalist=seq[tree[target].index].RenaList;
				for(var e in renalist){
					var pos=renalist[e].pos;
					var text=renalist[e].text;
					var a = parseInt((parseInt(pos,16)-1)/16),
					b = (parseInt(pos,16)-1)%16;
					var src=$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src");
					if(/c([a-z]{1,2}\.gif)$/.test(src)){//需要修正的话
						src=src.replace(/c([a-z]{1,2}\.gif)$/,"t$1");//替换为空心方框
						$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src",src);
					}
					this.wt(this.Pos2Board(pos), -1, text);//子节点棋盘文字
				}
			}
			this.manualPtr=target;
		},
		ManualBackward:function(){
			var tree=this.decode.tree;
			var seq=this.decode.seq;
			var now=this.manualPtr;
			var a,b,m;
			if(now==0)return false;//退到起点
			//取消当前节点的子节点的显示
			for(var e in tree[now].sons){
				var son=tree[tree[now].sons[e]];
				var pos=seq[son.index].pos;
				
				var a = parseInt((parseInt(pos,16)-1)/16),
				b = (parseInt(pos,16)-1)%16;
				$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src", this.getImage(a, b));
				if(seq[son.index].flag&256){
					this.wt(this.getPos(a,b), -1, "");//取消棋盘文字
				}
			}
			//清除Rena棋盘文字列表
			if(this.type=="Rena" && (seq[tree[now].index].flag&4)){
				var renalist=seq[tree[now].index].RenaList;
				for(var e in renalist){
					var pos=renalist[e].pos;
					this.wt(this.Pos2Board(pos), -1, "");//子节点棋盘文字
				}
			}
			//取消注释
			if((seq[tree[now].index].flag&8) || (seq[tree[now].index].flag&32)){
				$("#"+this.prefix+"_comment").html("");
			}
			//取消当前节点
			var p=seq[tree[now].index].pos;
			a = parseInt((parseInt(p,16)-1)/16),
			b = (parseInt(p,16)-1)%16;
			m= this.getPos(a,b);
            $("#"+this.prefix+"_board img#"+this.prefix+"_" + m).attr("src", this.getImage(a, b));
            this.bd[a * 15 + b] = '.';
            var l=this.MS.length;
			this.wt(m, l, "");//清除文字
            this.MS.length--;//棋谱回退
            if (this.MS.length) this.wt(this.MS[l - 2], l - 2, l - 1);//重新标文字
            $("#"+this.prefix+"_moves").attr("value", this.getMoves());//更新棋谱
            $("#"+this.prefix+"_steps").attr("value", this.MS.length);
			//显示兄弟节点
			var target=tree[now].parent;
			if(target!=-1){
				for(var e in tree[target].sons){
					var son=tree[tree[target].sons[e]];
					var pos=seq[son.index].pos;
					var text=seq[son.index].text;

					var a = parseInt((parseInt(pos,16)-1)/16),
					b = (parseInt(pos,16)-1)%16;
					if(!(seq[son.index].flag&2)){
						$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src", this.gio(a, b));
					}
					if(seq[son.index].flag&256){
						if(!(seq[son.index].flag&2)){
							var src=$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src");
							src=src.replace(/c([a-z]{1,2}\.gif)$/,"t$1");//替换为空心方框
							$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src",src);
						}
						this.wt(this.getPos(a,b), -1, text);//子节点棋盘文字
					}
				}
				//Rena棋盘文字列表
				if(this.type=="Rena" && (seq[tree[target].index].flag&4)){
					var renalist=seq[tree[target].index].RenaList;
					for(var e in renalist){
						var pos=renalist[e].pos;
						var text=renalist[e].text;
						
						var a = parseInt((parseInt(pos,16)-1)/16),
						b = (parseInt(pos,16)-1)%16;
						
						var src=$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src");
						if(/c([a-z]{1,2}\.gif)$/.test(src)){//需要修正的话
							src=src.replace(/c([a-z]{1,2}\.gif)$/,"t$1");//替换为空心方框
							$("#"+this.prefix+"_board img#"+this.prefix+"_"+ this.getPos(a,b)).attr("src",src);
						}
						this.wt(this.getPos(a,b), -1, text);//子节点棋盘文字
					}
				}
				//父节点的注释
				if((seq[tree[target].index].flag&8) || (seq[tree[target].index].flag&32)){
					$("#"+this.prefix+"_comment").html(seq[tree[target].index].comment);
				}
			}
			this.manualPtr=target;
			return false;
		}
    };
	
	//gb2312解码函数
	var gb2uni="a1a13000a1a23001a1a33002a1a430fba1a502c9a1a602c7a1a700a8a1a83003a1a93005a1aa2015a1abff5ea1ac2016a1ad2026a1ae2018a1af2019a1b0201ca1b1201da1b23014a1b33015a1b43008a1b53009a1b6300aa1b7300ba1b8300ca1b9300da1ba300ea1bb300fa1bc3016a1bd3017a1be3010a1bf3011a1c000b1a1c100d7a1c200f7a1c32236a1c42227a1c52228a1c62211a1c7220fa1c8222aa1c92229a1ca2208a1cb2237a1cc221aa1cd22a5a1ce2225a1cf2220a1d02312a1d12299a1d2222ba1d3222ea1d42261a1d5224ca1d62248a1d7223da1d8221da1d92260a1da226ea1db226fa1dc2264a1dd2265a1de221ea1df2235a1e02234a1e12642a1e22640a1e300b0a1e42032a1e52033a1e62103a1e7ff04a1e800a4a1e9ffe0a1eaffe1a1eb2030a1ec00a7a1ed2116a1ee2606a1ef2605a1f025cba1f125cfa1f225cea1f325c7a1f425c6a1f525a1a1f625a0a1f725b3a1f825b2a1f9203ba1fa2192a1fb2190a1fc2191a1fd2193a1fe3013a2b12488a2b22489a2b3248aa2b4248ba2b5248ca2b6248da2b7248ea2b8248fa2b92490a2ba2491a2bb2492a2bc2493a2bd2494a2be2495a2bf2496a2c02497a2c12498a2c22499a2c3249aa2c4249ba2c52474a2c62475a2c72476a2c82477a2c92478a2ca2479a2cb247aa2cc247ba2cd247ca2ce247da2cf247ea2d0247fa2d12480a2d22481a2d32482a2d42483a2d52484a2d62485a2d72486a2d82487a2d92460a2da2461a2db2462a2dc2463a2dd2464a2de2465a2df2466a2e02467a2e12468a2e22469a2e53220a2e63221a2e73222a2e83223a2e93224a2ea3225a2eb3226a2ec3227a2ed3228a2ee3229a2f12160a2f22161a2f32162a2f42163a2f52164a2f62165a2f72166a2f82167a2f92168a2fa2169a2fb216aa2fc216ba3a1ff01a3a2ff02a3a3ff03a3a4ffe5a3a5ff05a3a6ff06a3a7ff07a3a8ff08a3a9ff09a3aaff0aa3abff0ba3acff0ca3adff0da3aeff0ea3afff0fa3b0ff10a3b1ff11a3b2ff12a3b3ff13a3b4ff14a3b5ff15a3b6ff16a3b7ff17a3b8ff18a3b9ff19a3baff1aa3bbff1ba3bcff1ca3bdff1da3beff1ea3bfff1fa3c0ff20a3c1ff21a3c2ff22a3c3ff23a3c4ff24a3c5ff25a3c6ff26a3c7ff27a3c8ff28a3c9ff29a3caff2aa3cbff2ba3ccff2ca3cdff2da3ceff2ea3cfff2fa3d0ff30a3d1ff31a3d2ff32a3d3ff33a3d4ff34a3d5ff35a3d6ff36a3d7ff37a3d8ff38a3d9ff39a3daff3aa3dbff3ba3dcff3ca3ddff3da3deff3ea3dfff3fa3e0ff40a3e1ff41a3e2ff42a3e3ff43a3e4ff44a3e5ff45a3e6ff46a3e7ff47a3e8ff48a3e9ff49a3eaff4aa3ebff4ba3ecff4ca3edff4da3eeff4ea3efff4fa3f0ff50a3f1ff51a3f2ff52a3f3ff53a3f4ff54a3f5ff55a3f6ff56a3f7ff57a3f8ff58a3f9ff59a3faff5aa3fbff5ba3fcff5ca3fdff5da3feffe3a4a13041a4a23042a4a33043a4a43044a4a53045a4a63046a4a73047a4a83048a4a93049a4aa304aa4ab304ba4ac304ca4ad304da4ae304ea4af304fa4b03050a4b13051a4b23052a4b33053a4b43054a4b53055a4b63056a4b73057a4b83058a4b93059a4ba305aa4bb305ba4bc305ca4bd305da4be305ea4bf305fa4c03060a4c13061a4c23062a4c33063a4c43064a4c53065a4c63066a4c73067a4c83068a4c93069a4ca306aa4cb306ba4cc306ca4cd306da4ce306ea4cf306fa4d03070a4d13071a4d23072a4d33073a4d43074a4d53075a4d63076a4d73077a4d83078a4d93079a4da307aa4db307ba4dc307ca4dd307da4de307ea4df307fa4e03080a4e13081a4e23082a4e33083a4e43084a4e53085a4e63086a4e73087a4e83088a4e93089a4ea308aa4eb308ba4ec308ca4ed308da4ee308ea4ef308fa4f03090a4f13091a4f23092a4f33093a5a130a1a5a230a2a5a330a3a5a430a4a5a530a5a5a630a6a5a730a7a5a830a8a5a930a9a5aa30aaa5ab30aba5ac30aca5ad30ada5ae30aea5af30afa5b030b0a5b130b1a5b230b2a5b330b3a5b430b4a5b530b5a5b630b6a5b730b7a5b830b8a5b930b9a5ba30baa5bb30bba5bc30bca5bd30bda5be30bea5bf30bfa5c030c0a5c130c1a5c230c2a5c330c3a5c430c4a5c530c5a5c630c6a5c730c7a5c830c8a5c930c9a5ca30caa5cb30cba5cc30cca5cd30cda5ce30cea5cf30cfa5d030d0a5d130d1a5d230d2a5d330d3a5d430d4a5d530d5a5d630d6a5d730d7a5d830d8a5d930d9a5da30daa5db30dba5dc30dca5dd30dda5de30dea5df30dfa5e030e0a5e130e1a5e230e2a5e330e3a5e430e4a5e530e5a5e630e6a5e730e7a5e830e8a5e930e9a5ea30eaa5eb30eba5ec30eca5ed30eda5ee30eea5ef30efa5f030f0a5f130f1a5f230f2a5f330f3a5f430f4a5f530f5a5f630f6a6a10391a6a20392a6a30393a6a40394a6a50395a6a60396a6a70397a6a80398a6a90399a6aa039aa6ab039ba6ac039ca6ad039da6ae039ea6af039fa6b003a0a6b103a1a6b203a3a6b303a4a6b403a5a6b503a6a6b603a7a6b703a8a6b803a9a6c103b1a6c203b2a6c303b3a6c403b4a6c503b5a6c603b6a6c703b7a6c803b8a6c903b9a6ca03baa6cb03bba6cc03bca6cd03bda6ce03bea6cf03bfa6d003c0a6d103c1a6d203c3a6d303c4a6d403c5a6d503c6a6d603c7a6d703c8a6d803c9a7a10410a7a20411a7a30412a7a40413a7a50414a7a60415a7a70401a7a80416a7a90417a7aa0418a7ab0419a7ac041aa7ad041ba7ae041ca7af041da7b0041ea7b1041fa7b20420a7b30421a7b40422a7b50423a7b60424a7b70425a7b80426a7b90427a7ba0428a7bb0429a7bc042aa7bd042ba7be042ca7bf042da7c0042ea7c1042fa7d10430a7d20431a7d30432a7d40433a7d50434a7d60435a7d70451a7d80436a7d90437a7da0438a7db0439a7dc043aa7dd043ba7de043ca7df043da7e0043ea7e1043fa7e20440a7e30441a7e40442a7e50443a7e60444a7e70445a7e80446a7e90447a7ea0448a7eb0449a7ec044aa7ed044ba7ee044ca7ef044da7f0044ea7f1044fa8a10101a8a200e1a8a301cea8a400e0a8a50113a8a600e9a8a7011ba8a800e8a8a9012ba8aa00eda8ab01d0a8ac00eca8ad014da8ae00f3a8af01d2a8b000f2a8b1016ba8b200faa8b301d4a8b400f9a8b501d6a8b601d8a8b701daa8b801dca8b900fca8ba00eaa8c53105a8c63106a8c73107a8c83108a8c93109a8ca310aa8cb310ba8cc310ca8cd310da8ce310ea8cf310fa8d03110a8d13111a8d23112a8d33113a8d43114a8d53115a8d63116a8d73117a8d83118a8d93119a8da311aa8db311ba8dc311ca8dd311da8de311ea8df311fa8e03120a8e13121a8e23122a8e33123a8e43124a8e53125a8e63126a8e73127a8e83128a8e93129a9a42500a9a52501a9a62502a9a72503a9a82504a9a92505a9aa2506a9ab2507a9ac2508a9ad2509a9ae250aa9af250ba9b0250ca9b1250da9b2250ea9b3250fa9b42510a9b52511a9b62512a9b72513a9b82514a9b92515a9ba2516a9bb2517a9bc2518a9bd2519a9be251aa9bf251ba9c0251ca9c1251da9c2251ea9c3251fa9c42520a9c52521a9c62522a9c72523a9c82524a9c92525a9ca2526a9cb2527a9cc2528a9cd2529a9ce252aa9cf252ba9d0252ca9d1252da9d2252ea9d3252fa9d42530a9d52531a9d62532a9d72533a9d82534a9d92535a9da2536a9db2537a9dc2538a9dd2539a9de253aa9df253ba9e0253ca9e1253da9e2253ea9e3253fa9e42540a9e52541a9e62542a9e72543a9e82544a9e92545a9ea2546a9eb2547a9ec2548a9ed2549a9ee254aa9ef254bb0a1554ab0a2963fb0a357c3b0a46328b0a554ceb0a65509b0a754c0b0a87691b0a9764cb0aa853cb0ab77eeb0ac827eb0ad788db0ae7231b0af9698b0b0978db0b16c28b0b25b89b0b34ffab0b46309b0b56697b0b65cb8b0b780fab0b86848b0b980aeb0ba6602b0bb76ceb0bc51f9b0bd6556b0be71acb0bf7ff1b0c08884b0c150b2b0c25965b0c361cab0c46fb3b0c582adb0c6634cb0c76252b0c853edb0c95427b0ca7b06b0cb516bb0cc75a4b0cd5df4b0ce62d4b0cf8dcbb0d09776b0d1628ab0d28019b0d3575db0d49738b0d57f62b0d67238b0d7767db0d867cfb0d9767eb0da6446b0db4f70b0dc8d25b0dd62dcb0de7a17b0df6591b0e073edb0e1642cb0e26273b0e3822cb0e49881b0e5677fb0e67248b0e7626eb0e862ccb0e94f34b0ea74e3b0eb534ab0ec529eb0ed7ecab0ee90a6b0ef5e2eb0f06886b0f1699cb0f28180b0f37ed1b0f468d2b0f578c5b0f6868cb0f79551b0f8508db0f98c24b0fa82deb0fb80deb0fc5305b0fd8912b0fe5265b1a18584b1a296f9b1a34fddb1a45821b1a59971b1a65b9db1a762b1b1a862a5b1a966b4b1aa8c79b1ab9c8db1ac7206b1ad676fb1ae7891b1af60b2b1b05351b1b15317b1b28f88b1b380ccb1b48d1db1b594a1b1b6500db1b772c8b1b85907b1b960ebb1ba7119b1bb88abb1bc5954b1bd82efb1be672cb1bf7b28b1c05d29b1c17ef7b1c2752db1c36cf5b1c48e66b1c58ff8b1c6903cb1c79f3bb1c86bd4b1c99119b1ca7b14b1cb5f7cb1cc78a7b1cd84d6b1ce853db1cf6bd5b1d06bd9b1d16bd6b1d25e01b1d35e87b1d475f9b1d595edb1d6655db1d75f0ab1d85fc5b1d98f9fb1da58c1b1db81c2b1dc907fb1dd965bb1de97adb1df8fb9b1e07f16b1e18d2cb1e26241b1e34fbfb1e453d8b1e5535eb1e68fa8b1e78fa9b1e88fabb1e9904db1ea6807b1eb5f6ab1ec8198b1ed8868b1ee9cd6b1ef618bb1f0522bb1f1762ab1f25f6cb1f3658cb1f46fd2b1f56ee8b1f65bbeb1f76448b1f85175b1f951b0b1fa67c4b1fb4e19b1fc79c9b1fd997cb1fe70b3b2a175c5b2a25e76b2a373bbb2a483e0b2a564adb2a662e8b2a794b5b2a86ce2b2a9535ab2aa52c3b2ab640fb2ac94c2b2ad7b94b2ae4f2fb2af5e1bb2b08236b2b18116b2b2818ab2b36e24b2b46ccab2b59a73b2b66355b2b7535cb2b854fab2b98865b2ba57e0b2bb4e0db2bc5e03b2bd6b65b2be7c3fb2bf90e8b2c06016b2c164e6b2c2731cb2c388c1b2c46750b2c5624db2c68d22b2c7776cb2c88e29b2c991c7b2ca5f69b2cb83dcb2cc8521b2cd9910b2ce53c2b2cf8695b2d06b8bb2d160edb2d260e8b2d3707fb2d482cdb2d58231b2d64ed3b2d76ca7b2d885cfb2d964cdb2da7cd9b2db69fdb2dc66f9b2dd8349b2de5395b2df7b56b2e04fa7b2e1518cb2e26d4bb2e35c42b2e48e6db2e563d2b2e653c9b2e7832cb2e88336b2e967e5b2ea78b4b2eb643db2ec5bdfb2ed5c94b2ee5deeb2ef8be7b2f062c6b2f167f4b2f28c7ab2f36400b2f463bab2f58749b2f6998bb2f78c17b2f87f20b2f994f2b2fa4ea7b2fb9610b2fc98a4b2fd660cb2fe7316b3a1573ab3a25c1db3a35e38b3a4957fb3a5507fb3a680a0b3a75382b3a8655eb3a97545b3aa5531b3ab5021b3ac8d85b3ad6284b3ae949eb3af671db3b05632b3b16f6eb3b25de2b3b35435b3b47092b3b58f66b3b6626fb3b764a4b3b863a3b3b95f7bb3ba6f88b3bb90f4b3bc81e3b3bd8fb0b3be5c18b3bf6668b3c05ff1b3c16c89b3c29648b3c38d81b3c4886cb3c56491b3c679f0b3c757ceb3c86a59b3c96210b3ca5448b3cb4e58b3cc7a0bb3cd60e9b3ce6f84b3cf8bdab3d0627fb3d1901eb3d29a8bb3d379e4b3d45403b3d575f4b3d66301b3d75319b3d86c60b3d98fdfb3da5f1bb3db9a70b3dc803bb3dd9f7fb3de4f88b3df5c3ab3e08d64b3e17fc5b3e265a5b3e370bdb3e45145b3e551b2b3e6866bb3e75d07b3e85ba0b3e962bdb3ea916cb3eb7574b3ec8e0cb3ed7a20b3ee6101b3ef7b79b3f04ec7b3f17ef8b3f27785b3f34e11b3f481edb3f5521db3f651fab3f76a71b3f853a8b3f98e87b3fa9504b3fb96cfb3fc6ec1b3fd9664b3fe695ab4a17840b4a250a8b4a377d7b4a46410b4a589e6b4a65904b4a763e3b4a85dddb4a97a7fb4aa693db4ab4f20b4ac8239b4ad5598b4ae4e32b4af75aeb4b07a97b4b15e62b4b25e8ab4b395efb4b4521bb4b55439b4b6708ab4b76376b4b89524b4b95782b4ba6625b4bb693fb4bc9187b4bd5507b4be6df3b4bf7eafb4c08822b4c16233b4c27ef0b4c375b5b4c48328b4c578c1b4c696ccb4c78f9eb4c86148b4c974f7b4ca8bcdb4cb6b64b4cc523ab4cd8d50b4ce6b21b4cf806ab4d08471b4d156f1b4d25306b4d34eceb4d44e1bb4d551d1b4d67c97b4d7918bb4d87c07b4d94fc3b4da8e7fb4db7be1b4dc7a9cb4dd6467b4de5d14b4df50acb4e08106b4e17601b4e27cb9b4e36decb4e47fe0b4e56751b4e65b58b4e75bf8b4e878cbb4e964aeb4ea6413b4eb63aab4ec632bb4ed9519b4ee642db4ef8fbeb4f07b54b4f17629b4f26253b4f35927b4f45446b4f56b79b4f650a3b4f76234b4f85e26b4f96b86b4fa4ee3b4fb8d37b4fc888bb4fd5f85b4fe902eb5a16020b5a2803db5a362c5b5a44e39b5a55355b5a690f8b5a763b8b5a880c6b5a965e6b5aa6c2eb5ab4f46b5ac60eeb5ad6de1b5ae8bdeb5af5f39b5b086cbb5b15f53b5b26321b5b3515ab5b48361b5b56863b5b65200b5b76363b5b88e48b5b95012b5ba5c9bb5bb7977b5bc5bfcb5bd5230b5be7a3bb5bf60bcb5c09053b5c176d7b5c25fb7b5c35f97b5c47684b5c58e6cb5c6706fb5c7767bb5c87b49b5c977aab5ca51f3b5cb9093b5cc5824b5cd4f4eb5ce6ef4b5cf8feab5d0654cb5d17b1bb5d272c4b5d36da4b5d47fdfb5d55ae1b5d662b5b5d75e95b5d85730b5d98482b5da7b2cb5db5e1db5dc5f1fb5dd9012b5de7f14b5df98a0b5e06382b5e16ec7b5e27898b5e370b9b5e45178b5e5975bb5e657abb5e77535b5e84f43b5e97538b5ea5e97b5eb60e6b5ec5960b5ed6dc0b5ee6bbfb5ef7889b5f053fcb5f196d5b5f251cbb5f35201b5f46389b5f5540ab5f69493b5f78c03b5f88dccb5f97239b5fa789fb5fb8776b5fc8fedb5fd8c0db5fe53e0b6a14e01b6a276efb6a353eeb6a49489b6a59876b6a69f0eb6a7952db6a85b9ab6a98ba2b6aa4e22b6ab4e1cb6ac51acb6ad8463b6ae61c2b6af52a8b6b0680bb6b14f97b6b2606bb6b351bbb6b46d1eb6b5515cb6b66296b6b76597b6b89661b6b98c46b6ba9017b6bb75d8b6bc90fdb6bd7763b6be6bd2b6bf728ab6c072ecb6c18bfbb6c25835b6c37779b6c48d4cb6c5675cb6c69540b6c7809ab6c85ea6b6c96e21b6ca5992b6cb7aefb6cc77edb6cd953bb6ce6bb5b6cf65adb6d07f0eb6d15806b6d25151b6d3961fb6d45bf9b6d558a9b6d65428b6d78e72b6d86566b6d9987fb6da56e4b6db949db6dc76feb6dd9041b6de6387b6df54c6b6e0591ab6e1593ab6e2579bb6e38eb2b6e46735b6e58dfab6e68235b6e75241b6e860f0b6e95815b6ea86feb6eb5ce8b6ec9e45b6ed4fc4b6ee989db6ef8bb9b6f05a25b6f16076b6f25384b6f3627cb6f4904fb6f59102b6f6997fb6f76069b6f8800cb6f9513fb6fa8033b6fb5c14b6fc9975b6fd6d31b6fe4e8cb7a18d30b7a253d1b7a37f5ab7a47b4fb7a54f10b7a64e4fb7a79600b7a86cd5b7a973d0b7aa85e9b7ab5e06b7ac756ab7ad7ffbb7ae6a0ab7af77feb7b09492b7b17e41b7b251e1b7b370e6b7b453cdb7b58fd4b7b68303b7b78d29b7b872afb7b9996db7ba6cdbb7bb574ab7bc82b3b7bd65b9b7be80aab7bf623fb7c09632b7c159a8b7c24effb7c38bbfb7c47ebab7c5653eb7c683f2b7c7975eb7c85561b7c998deb7ca80a5b7cb532ab7cc8bfdb7cd5420b7ce80bab7cf5e9fb7d06cb8b7d18d39b7d282acb7d3915ab7d45429b7d56c1bb7d65206b7d77eb7b7d8575fb7d9711ab7da6c7eb7db7c89b7dc594bb7dd4efdb7de5fffb7df6124b7e07caab7e14e30b7e25c01b7e367abb7e48702b7e55cf0b7e6950bb7e798ceb7e875afb7e970fdb7ea9022b7eb51afb7ec7f1db7ed8bbdb7ee5949b7ef51e4b7f04f5bb7f15426b7f2592bb7f36577b7f480a4b7f55b75b7f66276b7f762c2b7f88f90b7f95e45b7fa6c1fb7fb7b26b7fc4f0fb7fd4fd8b7fe670db8a16d6eb8a26daab8a3798fb8a488b1b8a55f17b8a6752bb8a7629ab8a88f85b8a94fefb8aa91dcb8ab65a7b8ac812fb8ad8151b8ae5e9cb8af8150b8b08d74b8b1526fb8b28986b8b38d4bb8b4590db8b55085b8b64ed8b8b7961cb8b87236b8b98179b8ba8d1fb8bb5bccb8bc8ba3b8bd9644b8be5987b8bf7f1ab8c05490b8c15676b8c2560eb8c38be5b8c46539b8c56982b8c69499b8c776d6b8c86e89b8c95e72b8ca7518b8cb6746b8cc67d1b8cd7affb8ce809db8cf8d76b8d0611fb8d179c6b8d26562b8d38d63b8d45188b8d5521ab8d694a2b8d77f38b8d8809bb8d97eb2b8da5c97b8db6e2fb8dc6760b8dd7bd9b8de768bb8df9ad8b8e0818fb8e17f94b8e27cd5b8e3641eb8e49550b8e57a3fb8e6544ab8e754e5b8e86b4cb8e96401b8ea6208b8eb9e3db8ec80f3b8ed7599b8ee5272b8ef9769b8f0845bb8f1683cb8f286e4b8f39601b8f49694b8f594ecb8f64e2ab8f75404b8f87ed9b8f96839b8fa8ddfb8fb8015b8fc66f4b8fd5e9ab8fe7fb9b9a157c2b9a2803fb9a36897b9a45de5b9a5653bb9a6529fb9a7606db9a89f9ab9a94f9bb9aa8eacb9ab516cb9ac5babb9ad5f13b9ae5de9b9af6c5eb9b062f1b9b18d21b9b25171b9b394a9b9b452feb9b56c9fb9b682dfb9b772d7b9b857a2b9b96784b9ba8d2db9bb591fb9bc8f9cb9bd83c7b9be5495b9bf7b8db9c04f30b9c16cbdb9c25b64b9c359d1b9c49f13b9c553e4b9c686cab9c79aa8b9c88c37b9c980a1b9ca6545b9cb987eb9cc56fab9cd96c7b9ce522eb9cf74dcb9d05250b9d15be1b9d26302b9d38902b9d44e56b9d562d0b9d6602ab9d768fab9d85173b9d95b98b9da51a0b9db89c2b9dc7ba1b9dd9986b9de7f50b9df60efb9e0704cb9e18d2fb9e25149b9e35e7fb9e4901bb9e57470b9e689c4b9e7572db9e87845b9e95f52b9ea9f9fb9eb95fab9ec8f68b9ed9b3cb9ee8be1b9ef7678b9f06842b9f167dcb9f28deab9f38d35b9f4523db9f58f8ab9f66edab9f768cdb9f89505b9f990edb9fa56fdb9fb679cb9fc88f9b9fd8fc7b9fe54c8baa19ab8baa25b69baa36d77baa46c26baa54ea5baa65bb3baa79a87baa89163baa961a8baaa90afbaab97e9baac542bbaad6db5baae5bd2baaf51fdbab0558abab17f55bab27ff0bab364bcbab4634dbab565f1bab661bebab7608dbab8710abab96c57baba6c49babb592fbabc676dbabd822ababe58d5babf568ebac08c6abac16bebbac290ddbac3597dbac48017bac553f7bac66d69bac75475bac8559dbac98377baca83cfbacb6838bacc79bebacd548cbace4f55bacf5408bad076d2bad18c89bad29602bad36cb3bad46db8bad58d6bbad68910bad79e64bad88d3abad9563fbada9ed1badb75d5badc5f88badd72e0bade6068badf54fcbae04ea8bae16a2abae28861bae36052bae48f70bae554c4bae670d8bae78679bae89e3fbae96d2abaea5b8fbaeb5f18baec7ea2baed5589baee4fafbaef7334baf0543cbaf1539abaf25019baf3540ebaf4547cbaf54e4ebaf65ffdbaf7745abaf858f6baf9846bbafa80e1bafb8774bafc72d0bafd7ccabafe6e56bba15f27bba2864ebba3552cbba462a4bba54e92bba66caabba76237bba882b1bba954d7bbaa534ebbab733ebbac6ed1bbad753bbbae5212bbaf5316bbb08bddbbb169d0bbb25f8abbb36000bbb46deebbb5574fbbb66b22bbb773afbbb86853bbb98fd8bbba7f13bbbb6362bbbc60a3bbbd5524bbbe75eabbbf8c62bbc07115bbc16da3bbc25ba6bbc35e7bbbc48352bbc5614cbbc69ec4bbc778fabbc88757bbc97c27bbca7687bbcb51f0bbcc60f6bbcd714cbbce6643bbcf5e4cbbd0604dbbd18c0ebbd27070bbd36325bbd48f89bbd55fbdbbd66062bbd786d4bbd856debbd96bc1bbda6094bbdb6167bbdc5349bbdd60e0bbde6666bbdf8d3fbbe079fdbbe14f1abbe270e9bbe36c47bbe48bb3bbe58bf2bbe67ed8bbe78364bbe8660fbbe95a5abbea9b42bbeb6d51bbec6df7bbed8c41bbee6d3bbbef4f19bbf0706bbbf183b7bbf26216bbf360d1bbf4970dbbf58d27bbf67978bbf751fbbbf8573ebbf957fabbfa673abbfb7578bbfc7a3dbbfd79efbbfe7b95bca1808cbca29965bca38ff9bca46fc0bca58ba5bca69e21bca759ecbca87ee9bca97f09bcaa5409bcab6781bcac68d8bcad8f91bcae7c4dbcaf96c6bcb053cabcb16025bcb275bebcb36c72bcb45373bcb55ac9bcb67ea7bcb76324bcb851e0bcb9810abcba5df1bcbb84dfbcbc6280bcbd5180bcbe5b63bcbf4f0ebcc0796dbcc15242bcc260b8bcc36d4ebcc45bc4bcc55bc2bcc68ba1bcc78bb0bcc865e2bcc95fccbcca9645bccb5993bccc7ee7bccd7eaabcce5609bccf67b7bcd05939bcd14f73bcd25bb6bcd352a0bcd4835abcd5988abcd68d3ebcd77532bcd894bebcd95047bcda7a3cbcdb4ef7bcdc67b6bcdd9a7ebcde5ac1bcdf6b7cbce076d1bce1575abce25c16bce37b3abce495f4bce5714ebce6517cbce780a9bce88270bce95978bcea7f04bceb8327bcec68c0bced67ecbcee78b1bcef7877bcf062e3bcf16361bcf27b80bcf34fedbcf4526abcf551cfbcf68350bcf769dbbcf89274bcf98df5bcfa8d31bcfb89c1bcfc952ebcfd7badbcfe4ef6bda15065bda28230bda35251bda4996fbda56e10bda66e85bda76da7bda85efabda950f5bdaa59dcbdab5c06bdac6d46bdad6c5fbdae7586bdaf848bbdb06868bdb15956bdb28bb2bdb35320bdb49171bdb5964dbdb68549bdb76912bdb87901bdb97126bdba80f6bdbb4ea4bdbc90cabdbd6d47bdbe9a84bdbf5a07bdc056bcbdc16405bdc294f0bdc377ebbdc44fa5bdc5811abdc672e1bdc789d2bdc8997abdc97f34bdca7edebdcb527fbdcc6559bdcd9175bdce8f7fbdcf8f83bdd053ebbdd17a96bdd263edbdd363a5bdd47686bdd579f8bdd68857bdd79636bdd8622abdd952abbdda8282bddb6854bddc6770bddd6377bdde776bbddf7aedbde06d01bde17ed3bde289e3bde359d0bde46212bde585c9bde682a5bde7754cbde8501fbde94ecbbdea75a5bdeb8bebbdec5c4abded5dfebdee7b4bbdef65a4bdf091d1bdf14ecabdf26d25bdf3895fbdf47d27bdf59526bdf64ec5bdf78c28bdf88fdbbdf99773bdfa664bbdfb7981bdfc8fd1bdfd70ecbdfe6d78bea15c3dbea252b2bea38346bea45162bea5830ebea6775bbea76676bea89cb8bea94eacbeaa60cabeab7cbebeac7cb3bead7ecfbeae4e95beaf8b66beb0666fbeb19888beb29759beb35883beb4656cbeb5955cbeb65f84beb775c9beb89756beb97adfbeba7adebebb51c0bebc70afbebd7a98bebe63eabebf7a76bec07ea0bec17396bec297edbec34e45bec47078bec54e5dbec69152bec753a9bec86551bec965e7beca81fcbecb8205becc548ebecd5c31bece759abecf97a0bed062d8bed172d9bed275bdbed35c45bed49a79bed583cabed65c40bed75480bed877e9bed94e3ebeda6caebedb805abedc62d2bedd636ebede5de8bedf5177bee08dddbee18e1ebee2952fbee34ff1bee453e5bee560e7bee670acbee75267bee86350bee99e43beea5a1fbeeb5026beec7737beed5377beee7ee2beef6485bef0652bbef16289bef26398bef35014bef47235bef589c9bef651b3bef78bc0bef87eddbef95747befa83ccbefb94a7befc519bbefd541bbefe5cfbbfa14fcabfa27ae3bfa36d5abfa490e1bfa59a8fbfa65580bfa75496bfa85361bfa954afbfaa5f00bfab63e9bfac6977bfad51efbfae6168bfaf520abfb0582abfb152d8bfb2574ebfb3780dbfb4770bbfb55eb7bfb66177bfb77ce0bfb8625bbfb96297bfba4ea2bfbb7095bfbc8003bfbd62f7bfbe70e4bfbf9760bfc05777bfc182dbbfc267efbfc368f5bfc478d5bfc59897bfc679d1bfc758f3bfc854b3bfc953efbfca6e34bfcb514bbfcc523bbfcd5ba2bfce8bfebfcf80afbfd05543bfd157a6bfd26073bfd35751bfd4542dbfd57a7abfd66050bfd75b54bfd863a7bfd962a0bfda53e3bfdb6263bfdc5bc7bfdd67afbfde54edbfdf7a9fbfe082e6bfe19177bfe25e93bfe388e4bfe45938bfe557aebfe6630ebfe78de8bfe880efbfe95757bfea7b77bfeb4fa9bfec5febbfed5bbdbfee6b3ebfef5321bff07b50bff172c2bff26846bff377ffbff47736bff565f7bff651b5bff74e8fbff876d4bff95cbfbffa7aa5bffb8475bffc594ebffd9b41bffe5080c0a19988c0a26127c0a36e83c0a45764c0a56606c0a66346c0a756f0c0a862ecc0a96269c0aa5ed3c0ab9614c0ac5783c0ad62c9c0ae5587c0af8721c0b0814ac0b18fa3c0b25566c0b383b1c0b46765c0b58d56c0b684ddc0b75a6ac0b8680fc0b962e6c0ba7beec0bb9611c0bc5170c0bd6f9cc0be8c30c0bf63fdc0c089c8c0c161d2c0c27f06c0c370c2c0c46ee5c0c57405c0c66994c0c772fcc0c85ecac0c990cec0ca6717c0cb6d6ac0cc635ec0cd52b3c0ce7262c0cf8001c0d04f6cc0d159e5c0d2916ac0d370d9c0d46d9dc0d552d2c0d64e50c0d796f7c0d8956dc0d9857ec0da78cac0db7d2fc0dc5121c0dd5792c0de64c2c0df808bc0e07c7bc0e16ceac0e268f1c0e3695ec0e451b7c0e55398c0e668a8c0e77281c0e89ecec0e97bf1c0ea72f8c0eb79bbc0ec6f13c0ed7406c0ee674ec0ef91ccc0f09ca4c0f1793cc0f28389c0f38354c0f4540fc0f56817c0f64e3dc0f75389c0f852b1c0f9783ec0fa5386c0fb5229c0fc5088c0fd4f8bc0fe4fd0c1a175e2c1a27acbc1a37c92c1a46ca5c1a596b6c1a6529bc1a77483c1a854e9c1a94fe9c1aa8054c1ab83b2c1ac8fdec1ad9570c1ae5ec9c1af601cc1b06d9fc1b15e18c1b2655bc1b38138c1b494fec1b5604bc1b670bcc1b77ec3c1b87caec1b951c9c1ba6881c1bb7cb1c1bc826fc1bd4e24c1be8f86c1bf91cfc1c0667ec1c14eaec1c28c05c1c364a9c1c4804ac1c550dac1c67597c1c771cec1c85be5c1c98fbdc1ca6f66c1cb4e86c1cc6482c1cd9563c1ce5ed6c1cf6599c1d05217c1d188c2c1d270c8c1d352a3c1d4730ec1d57433c1d66797c1d778f7c1d89716c1d94e34c1da90bbc1db9cdec1dc6dcbc1dd51dbc1de8d41c1df541dc1e062cec1e173b2c1e283f1c1e396f6c1e49f84c1e594c3c1e64f36c1e77f9ac1e851ccc1e97075c1ea9675c1eb5cadc1ec9886c1ed53e6c1ee4ee4c1ef6e9cc1f07409c1f169b4c1f2786bc1f3998fc1f47559c1f55218c1f67624c1f76d41c1f867f3c1f9516dc1fa9f99c1fb804bc1fc5499c1fd7b3cc1fe7abfc2a19686c2a25784c2a362e2c2a49647c2a5697cc2a65a04c2a76402c2a87bd3c2a96f0fc2aa964bc2ab82a6c2ac5362c2ad9885c2ae5e90c2af7089c2b063b3c2b15364c2b2864fc2b39c81c2b49e93c2b5788cc2b69732c2b78defc2b88d42c2b99e7fc2ba6f5ec2bb7984c2bc5f55c2bd9646c2be622ec2bf9a74c2c05415c2c194ddc2c24fa3c2c365c5c2c45c65c2c55c61c2c67f15c2c78651c2c86c2fc2c95f8bc2ca7387c2cb6ee4c2cc7effc2cd5ce6c2ce631bc2cf5b6ac2d06ee6c2d15375c2d24e71c2d363a0c2d47565c2d562a1c2d68f6ec2d74f26c2d84ed1c2d96ca6c2da7eb6c2db8bbac2dc841dc2dd87bac2de7f57c2df903bc2e09523c2e17ba9c2e29aa1c2e388f8c2e4843dc2e56d1bc2e69a86c2e77edcc2e85988c2e99ebbc2ea739bc2eb7801c2ec8682c2ed9a6cc2ee9a82c2ef561bc2f05417c2f157cbc2f24e70c2f39ea6c2f45356c2f58fc8c2f68109c2f77792c2f89992c2f986eec2fa6ee1c2fb8513c2fc66fcc2fd6162c2fe6f2bc3a18c29c3a28292c3a3832bc3a476f2c3a56c13c3a65fd9c3a783bdc3a8732bc3a98305c3aa951ac3ab6bdbc3ac77dbc3ad94c6c3ae536fc3af8302c3b05192c3b15e3dc3b28c8cc3b38d38c3b44e48c3b573abc3b6679ac3b76885c3b89176c3b99709c3ba7164c3bb6ca1c3bc7709c3bd5a92c3be9541c3bf6bcfc3c07f8ec3c16627c3c25bd0c3c359b9c3c45a9ac3c595e8c3c695f7c3c74eecc3c8840cc3c98499c3ca6aacc3cb76dfc3cc9530c3cd731bc3ce68a6c3cf5b5fc3d0772fc3d1919ac3d29761c3d37cdcc3d48ff7c3d58c1cc3d65f25c3d77c73c3d879d8c3d989c5c3da6cccc3db871cc3dc5bc6c3dd5e42c3de68c9c3df7720c3e07ef5c3e15195c3e2514dc3e352c9c3e45a29c3e57f05c3e69762c3e782d7c3e863cfc3e97784c3ea85d0c3eb79d2c3ec6e3ac3ed5e99c3ee5999c3ef8511c3f0706dc3f16c11c3f262bfc3f376bfc3f4654fc3f560afc3f695fdc3f7660ec3f8879fc3f99e23c3fa94edc3fb540dc3fc547dc3fd8c2cc3fe6478c4a16479c4a28611c4a36a21c4a4819cc4a578e8c4a66469c4a79b54c4a862b9c4a9672bc4aa83abc4ab58a8c4ac9ed8c4ad6cabc4ae6f20c4af5bdec4b0964cc4b18c0bc4b2725fc4b367d0c4b462c7c4b57261c4b64ea9c4b759c6c4b86bcdc4b95893c4ba66aec4bb5e55c4bc52dfc4bd6155c4be6728c4bf76eec4c07766c4c17267c4c27a46c4c362ffc4c454eac4c55450c4c694a0c4c790a3c4c85a1cc4c97eb3c4ca6c16c4cb4e43c4cc5976c4cd8010c4ce5948c4cf5357c4d07537c4d196bec4d256cac4d36320c4d48111c4d5607cc4d695f9c4d76dd6c4d85462c4d99981c4da5185c4db5ae9c4dc80fdc4dd59aec4de9713c4df502ac4e06ce5c4e15c3cc4e262dfc4e34f60c4e4533fc4e5817bc4e69006c4e76ebac4e8852bc4e962c8c4ea5e74c4eb78bec4ec64b5c4ed637bc4ee5ff5c4ef5a18c4f0917fc4f19e1fc4f25c3fc4f3634fc4f48042c4f55b7dc4f6556ec4f7954ac4f8954dc4f96d85c4fa60a8c4fb67e0c4fc72dec4fd51ddc4fe5b81c5a162e7c5a26cdec5a3725bc5a4626dc5a594aec5a67ebdc5a78113c5a86d53c5a9519cc5aa5f04c5ab5974c5ac52aac5ad6012c5ae5973c5af6696c5b08650c5b1759fc5b2632ac5b361e6c5b47cefc5b58bfac5b654e6c5b76b27c5b89e25c5b96bb4c5ba85d5c5bb5455c5bc5076c5bd6ca4c5be556ac5bf8db4c5c0722cc5c15e15c5c26015c5c37436c5c462cdc5c56392c5c6724cc5c75f98c5c86e43c5c96d3ec5ca6500c5cb6f58c5cc76d8c5cd78d0c5ce76fcc5cf7554c5d05224c5d153dbc5d24e53c5d35e9ec5d465c1c5d5802ac5d680d6c5d7629bc5d85486c5d95228c5da70aec5db888dc5dc8dd1c5dd6ce1c5de5478c5df80dac5e057f9c5e188f4c5e28d54c5e3966ac5e4914dc5e54f69c5e66c9bc5e755b7c5e876c6c5e97830c5ea62a8c5eb70f9c5ec6f8ec5ed5f6dc5ee84ecc5ef68dac5f0787cc5f17bf7c5f281a8c5f3670bc5f49e4fc5f56367c5f678b0c5f7576fc5f87812c5f99739c5fa6279c5fb62abc5fc5288c5fd7435c5fe6bd7c6a15564c6a2813ec6a375b2c6a476aec6a55339c6a675dec6a750fbc6a85c41c6a98b6cc6aa7bc7c6ab504fc6ac7247c6ad9a97c6ae98d8c6af6f02c6b074e2c6b17968c6b26487c6b377a5c6b462fcc6b59891c6b68d2bc6b754c1c6b88058c6b94e52c6ba576ac6bb82f9c6bc840dc6bd5e73c6be51edc6bf74f6c6c08bc4c6c15c4fc6c25761c6c36cfcc6c49887c6c55a46c6c67834c6c79b44c6c88febc6c97c95c6ca5256c6cb6251c6cc94fac6cd4ec6c6ce8386c6cf8461c6d083e9c6d184b2c6d257d4c6d36734c6d45703c6d5666ec6d66d66c6d78c31c6d866ddc6d97011c6da671fc6db6b3ac6dc6816c6dd621ac6de59bbc6df4e03c6e051c4c6e16f06c6e267d2c6e36c8fc6e45176c6e568cbc6e65947c6e76b67c6e87566c6e95d0ec6ea8110c6eb9f50c6ec65d7c6ed7948c6ee7941c6ef9a91c6f08d77c6f15c82c6f24e5ec6f34f01c6f4542fc6f55951c6f6780cc6f75668c6f86c14c6f98fc4c6fa5f03c6fb6c7dc6fc6ce3c6fd8babc6fe6390c7a16070c7a26d3dc7a37275c7a46266c7a5948ec7a694c5c7a75343c7a88fc1c7a97b7ec7aa4edfc7ab8c26c7ac4e7ec7ad9ed4c7ae94b1c7af94b3c7b0524dc7b16f5cc7b29063c7b36d45c7b48c34c7b55811c7b65d4cc7b76b20c7b86b49c7b967aac7ba545bc7bb8154c7bc7f8cc7bd5899c7be8537c7bf5f3ac7c062a2c7c16a47c7c29539c7c36572c7c46084c7c56865c7c677a7c7c74e54c7c84fa8c7c95de7c7ca9798c7cb64acc7cc7fd8c7cd5cedc7ce4fcfc7cf7a8dc7d05207c7d18304c7d24e14c7d3602fc7d47a83c7d594a6c7d64fb5c7d74eb2c7d879e6c7d97434c7da52e4c7db82b9c7dc64d2c7dd79bdc7de5bddc7df6c81c7e09752c7e18f7bc7e26c22c7e3503ec7e4537fc7e56e05c7e664cec7e76674c7e86c30c7e960c5c7ea9877c7eb8bf7c7ec5e86c7ed743cc7ee7a77c7ef79cbc7f04e18c7f190b1c7f27403c7f36c42c7f456dac7f5914bc7f66cc5c7f78d8bc7f8533ac7f986c6c7fa66f2c7fb8eafc7fc5c48c7fd9a71c7fe6e20c8a153d6c8a25a36c8a39f8bc8a48da3c8a553bbc8a65708c8a798a7c8a86743c8a9919bc8aa6cc9c8ab5168c8ac75cac8ad62f3c8ae72acc8af5238c8b0529dc8b17f3ac8b27094c8b37638c8b45374c8b59e4ac8b669b7c8b7786ec8b896c0c8b988d9c8ba7fa4c8bb7136c8bc71c3c8bd5189c8be67d3c8bf74e4c8c058e4c8c16518c8c256b7c8c38ba9c8c49976c8c56270c8c67ed5c8c760f9c8c870edc8c958ecc8ca4ec1c8cb4ebac8cc5fcdc8cd97e7c8ce4efbc8cf8ba4c8d05203c8d1598ac8d27eabc8d36254c8d44ecdc8d565e5c8d6620ec8d78338c8d884c9c8d98363c8da878dc8db7194c8dc6eb6c8dd5bb9c8de7ed2c8df5197c8e063c9c8e167d4c8e28089c8e38339c8e48815c8e55112c8e65b7ac8e75982c8e88fb1c8e94e73c8ea6c5dc8eb5165c8ec8925c8ed8f6fc8ee962ec8ef854ac8f0745ec8f19510c8f295f0c8f36da6c8f482e5c8f55f31c8f66492c8f76d12c8f88428c8f9816ec8fa9cc3c8fb585ec8fc8d5bc8fd4e09c8fe53c1c9a14f1ec9a26563c9a36851c9a455d3c9a54e27c9a66414c9a79a9ac9a8626bc9a95ac2c9aa745fc9ab8272c9ac6da9c9ad68eec9ae50e7c9af838ec9b07802c9b16740c9b25239c9b36c99c9b47eb1c9b550bbc9b65565c9b7715ec9b87b5bc9b96652c9ba73cac9bb82ebc9bc6749c9bd5c71c9be5220c9bf717dc9c0886bc9c195eac9c29655c9c364c5c9c48d61c9c581b3c9c65584c9c76c55c9c86247c9c97f2ec9ca5892c9cb4f24c9cc5546c9cd8d4fc9ce664cc9cf4e0ac9d05c1ac9d188f3c9d268a2c9d3634ec9d47a0dc9d570e7c9d6828dc9d752fac9d897f6c9d95c11c9da54e8c9db90b5c9dc7ecdc9dd5962c9de8d4ac9df86c7c9e0820cc9e1820dc9e28d66c9e36444c9e45c04c9e56151c9e66d89c9e7793ec9e88bbec9e97837c9ea7533c9eb547bc9ec4f38c9ed8eabc9ee6df1c9ef5a20c9f07ec5c9f1795ec9f26c88c9f35ba1c9f45a76c9f5751ac9f680bec9f7614ec9f86e17c9f958f0c9fa751fc9fb7525c9fc7272c9fd5347c9fe7ef3caa17701caa276dbcaa35269caa480dccaa55723caa65e08caa75931caa872eecaa965bdcaaa6e7fcaab8bd7caac5c38caad8671caae5341caaf77f3cab062fecab165f6cab24ec0cab398dfcab48680cab55b9ecab68bc6cab753f2cab877e2cab94f7fcaba5c4ecabb9a76cabc59cbcabd5f0fcabe793acabf58ebcac04e16cac167ffcac24e8bcac362edcac48a93cac5901dcac652bfcac7662fcac855dccac9566ccaca9002cacb4ed5cacc4f8dcacd91cacace9970cacf6c0fcad05e02cad16043cad25ba4cad389c6cad48bd5cad56536cad6624bcad79996cad85b88cad95bffcada6388cadb552ecadc53d7cadd7626cade517dcadf852ccae067a2cae168b3cae26b8acae36292cae48f93cae553d4cae68212cae76dd1cae8758fcae94e66caea8d4ecaeb5b70caec719fcaed85afcaee6691caef66d9caf07f72caf18700caf29ecdcaf39f20caf45c5ecaf5672fcaf68ff0caf76811caf8675fcaf9620dcafa7ad6cafb5885cafc5eb6cafd6570cafe6f31cba16055cba25237cba3800dcba46454cba58870cba67529cba75e05cba86813cba962f4cbaa971ccbab53cccbac723dcbad8c01cbae6c34cbaf7761cbb07a0ecbb1542ecbb277accbb3987acbb4821ccbb58bf4cbb67855cbb76714cbb870c1cbb965afcbba6495cbbb5636cbbc601dcbbd79c1cbbe53f8cbbf4e1dcbc06b7bcbc18086cbc25bfacbc355e3cbc456dbcbc54f3acbc64f3ccbc79972cbc85df3cbc9677ecbca8038cbcb6002cbcc9882cbcd9001cbce5b8bcbcf8bbccbd08bf5cbd1641ccbd28258cbd364decbd455fdcbd582cfcbd69165cbd74fd7cbd87d20cbd9901fcbda7c9fcbdb50f3cbdc5851cbdd6eafcbde5bbfcbdf8bc9cbe08083cbe19178cbe2849ccbe37b97cbe4867dcbe5968bcbe6968fcbe77ee5cbe89ad3cbe9788ecbea5c81cbeb7a57cbec9042cbed96a7cbee795fcbef5b59cbf0635fcbf17b0bcbf284d1cbf368adcbf45506cbf57f29cbf67410cbf77d22cbf89501cbf96240cbfa584ccbfb4ed6cbfc5b83cbfd5979cbfe5854cca1736dcca2631ecca38e4bcca48e0fcca580cecca682d4cca762accca853f0cca96cf0ccaa915eccab592accac6001ccad6c70ccae574dccaf644accb08d2accb1762bccb26ee9ccb3575bccb46a80ccb575f0ccb66f6dccb78c2dccb88c08ccb95766ccba6befccbb8892ccbc78b3ccbd63a2ccbe53f9ccbf70adccc06c64ccc15858ccc2642accc35802ccc468e0ccc5819bccc65510ccc77cd6ccc85018ccc98ebaccca6dcccccb8d9fcccc70ebcccd638fccce6d9bcccf6ed4ccd07ee6ccd18404ccd26843ccd39003ccd46dd8ccd59676ccd68ba8ccd75957ccd87279ccd985e4ccda817eccdb75bcccdc8a8accdd68afccde5254ccdf8e22cce09511cce163d0cce29898cce38e44cce4557ccce54f53cce666ffcce7568fcce860d5cce96d95ccea5243cceb5c49ccec5929cced6dfbccee586bccef7530ccf0751cccf1606cccf28214ccf38146ccf46311ccf56761ccf68fe2ccf7773accf88df3ccf98d34ccfa94c1ccfb5e16ccfc5385ccfd542cccfe70c3cda16c40cda25ef7cda3505ccda44eadcda55eadcda6633acda78247cda8901acda96850cdaa916ecdab77b3cdac540ccdad94dccdae5f64cdaf7ae5cdb06876cdb16345cdb27b52cdb37edfcdb475dbcdb55077cdb66295cdb75934cdb8900fcdb951f8cdba79c3cdbb7a81cdbc56fecdbd5f92cdbe9014cdbf6d82cdc05c60cdc1571fcdc25410cdc35154cdc46e4dcdc556e2cdc663a8cdc79893cdc8817fcdc98715cdca892acdcb9000cdcc541ecdcd5c6fcdce81c0cdcf62d6cdd06258cdd18131cdd29e35cdd39640cdd49a6ecdd59a7ccdd6692dcdd759a5cdd862d3cdd9553ecdda6316cddb54c7cddc86d9cddd6d3ccdde5a03cddf74e6cde0889ccde16b6acde25916cde38c4ccde45f2fcde56e7ecde673a9cde7987dcde84e38cde970f7cdea5b8ccdeb7897cdec633dcded665acdee7696cdef60cbcdf05b9bcdf15a49cdf24e07cdf38155cdf46c6acdf5738bcdf64ea1cdf76789cdf87f51cdf95f80cdfa65facdfb671bcdfc5fd8cdfd5984cdfe5a01cea15dcdcea25faecea35371cea497e6cea58fddcea66845cea756f4cea8552fcea960dfceaa4e3aceab6f4dceac7ef4cead82c7ceae840eceaf59d4ceb04f1fceb14f2aceb25c3eceb37eacceb4672aceb5851aceb65473ceb7754fceb880c3ceb95582ceba9b4fcebb4f4dcebc6e2dcebd8c13cebe5c09cebf6170cec0536bcec1761fcec26e29cec3868acec46587cec595fbcec67eb9cec7543bcec87a33cec97d0aceca95eececb55e1cecc7fc1cecd74eecece631dcecf8717ced06da1ced17a9dced26211ced365a1ced45367ced563e1ced66c83ced75debced8545cced994a8ceda4e4ccedb6c61cedc8beccedd5c4bcede65e0cedf829ccee068a7cee1543ecee25434cee36bcbcee46b66cee54e94cee66342cee75348cee8821ecee94f0dceea4faeceeb575eceec620aceed96feceee6664ceef7269cef052ffcef152a1cef2609fcef38befcef46614cef57199cef66790cef7897fcef87852cef977fdcefa6670cefb563bcefc5438cefd9521cefe727acfa17a00cfa2606fcfa35e0ccfa46089cfa5819dcfa65915cfa760dccfa87184cfa970efcfaa6eaacfab6c50cfac7280cfad6a84cfae88adcfaf5e2dcfb04e60cfb15ab3cfb2559ccfb394e3cfb46d17cfb57cfbcfb69699cfb7620fcfb87ec6cfb9778ecfba867ecfbb5323cfbc971ecfbd8f96cfbe6687cfbf5ce1cfc04fa0cfc172edcfc24e0bcfc353a6cfc4590fcfc55413cfc66380cfc79528cfc85148cfc94ed9cfca9c9ccfcb7ea4cfcc54b8cfcd8d24cfce8854cfcf8237cfd095f2cfd16d8ecfd25f26cfd35acccfd4663ecfd59669cfd673b0cfd7732ecfd853bfcfd9817acfda9985cfdb7fa1cfdc5baacfdd9677cfde9650cfdf7ebfcfe076f8cfe153a2cfe29576cfe39999cfe47bb1cfe58944cfe66e58cfe74e61cfe87fd4cfe97965cfea8be6cfeb60f3cfec54cdcfed4eabcfee9879cfef5df7cff06a61cff150cfcff25411cff38c61cff48427cff5785dcff69704cff7524acff854eecff956a3cffa9500cffb6d88cffc5bb5cffd6dc6cffe6653d0a15c0fd0a25b5dd0a36821d0a48096d0a55578d0a67b11d0a76548d0a86954d0a94e9bd0aa6b47d0ab874ed0ac978bd0ad534fd0ae631fd0af643ad0b090aad0b1659cd0b280c1d0b38c10d0b45199d0b568b0d0b65378d0b787f9d0b861c8d0b96cc4d0ba6cfbd0bb8c22d0bc5c51d0bd85aad0be82afd0bf950cd0c06b23d0c18f9bd0c265b0d0c35ffbd0c45fc3d0c54fe1d0c68845d0c7661fd0c88165d0c97329d0ca60fad0cb5174d0cc5211d0cd578bd0ce5f62d0cf90a2d0d0884cd0d19192d0d25e78d0d3674fd0d46027d0d559d3d0d65144d0d751f6d0d880f8d0d95308d0da6c79d0db96c4d0dc718ad0dd4f11d0de4feed0df7f9ed0e0673dd0e155c5d0e29508d0e379c0d0e48896d0e57ee3d0e6589fd0e7620cd0e89700d0e9865ad0ea5618d0eb987bd0ec5f90d0ed8bb8d0ee84c4d0ef9157d0f053d9d0f165edd0f25e8fd0f3755cd0f46064d0f57d6ed0f65a7fd0f77eead0f87eedd0f98f69d0fa55a7d0fb5ba3d0fc60acd0fd65cbd0fe7384d1a19009d1a27663d1a37729d1a47edad1a59774d1a6859bd1a75b66d1a87a74d1a996ead1aa8840d1ab52cbd1ac718fd1ad5faad1ae65ecd1af8be2d1b05bfbd1b19a6fd1b25de1d1b36b89d1b46c5bd1b58badd1b68bafd1b7900ad1b88fc5d1b9538bd1ba62bcd1bb9e26d1bc9e2dd1bd5440d1be4e2bd1bf82bdd1c07259d1c1869cd1c25d16d1c38859d1c46dafd1c596c5d1c654d1d1c74e9ad1c88bb6d1c97109d1ca54bdd1cb9609d1cc70dfd1cd6df9d1ce76d0d1cf4e25d1d07814d1d18712d1d25ca9d1d35ef6d1d48a00d1d5989cd1d6960ed1d7708ed1d86cbfd1d95944d1da63a9d1db773cd1dc884dd1dd6f14d1de8273d1df5830d1e071d5d1e1538cd1e2781ad1e396c1d1e45501d1e55f66d1e67130d1e75bb4d1e88c1ad1e99a8cd1ea6b83d1eb592ed1ec9e2fd1ed79e7d1ee6768d1ef626cd1f04f6fd1f175a1d1f27f8ad1f36d0bd1f49633d1f56c27d1f64ef0d1f775d2d1f8517bd1f96837d1fa6f3ed1fb9080d1fc8170d1fd5996d1fe7476d2a16447d2a25c27d2a39065d2a47a91d2a58c23d2a659dad2a754acd2a88200d2a9836fd2aa8981d2ab8000d2ac6930d2ad564ed2ae8036d2af7237d2b091ced2b151b6d2b24e5fd2b39875d2b46396d2b54e1ad2b653f6d2b766f3d2b8814bd2b9591cd2ba6db2d2bb4e00d2bc58f9d2bd533bd2be63d6d2bf94f1d2c04f9dd2c14f0ad2c28863d2c39890d2c45937d2c59057d2c679fbd2c74eead2c880f0d2c97591d2ca6c82d2cb5b9cd2cc59e8d2cd5f5dd2ce6905d2cf8681d2d0501ad2d15df2d2d24e59d2d377e3d2d44ee5d2d5827ad2d66291d2d76613d2d89091d2d95c79d2da4ebfd2db5f79d2dc81c6d2dd9038d2de8084d2df75abd2e04ea6d2e188d4d2e2610fd2e36bc5d2e45fc6d2e54e49d2e676cad2e76ea2d2e88be3d2e98baed2ea8c0ad2eb8bd1d2ec5f02d2ed7ffcd2ee7fccd2ef7eced2f08335d2f1836bd2f256e0d2f36bb7d2f497f3d2f59634d2f659fbd2f7541fd2f894f6d2f96debd2fa5bc5d2fb996ed2fc5c39d2fd5f15d2fe9690d3a15370d3a282f1d3a36a31d3a45a74d3a59e70d3a65e94d3a77f28d3a883b9d3a98424d3aa8425d3ab8367d3ac8747d3ad8fced3ae8d62d3af76c8d3b05f71d3b19896d3b2786cd3b36620d3b454dfd3b562e5d3b64f63d3b781c3d3b875c8d3b95eb8d3ba96cdd3bb8e0ad3bc86f9d3bd548fd3be6cf3d3bf6d8cd3c06c38d3c1607fd3c252c7d3c37528d3c45e7dd3c54f18d3c660a0d3c75fe7d3c85c24d3c97531d3ca90aed3cb94c0d3cc72b9d3cd6cb9d3ce6e38d3cf9149d3d06709d3d153cbd3d253f3d3d34f51d3d491c9d3d58bf1d3d653c8d3d75e7cd3d88fc2d3d96de4d3da4e8ed3db76c2d3dc6986d3dd865ed3de611ad3df8206d3e04f59d3e14fded3e2903ed3e39c7cd3e46109d3e56e1dd3e66e14d3e79685d3e84e88d3e95a31d3ea96e8d3eb4e0ed3ec5c7fd3ed79b9d3ee5b87d3ef8bedd3f07fbdd3f17389d3f257dfd3f3828bd3f490c1d3f55401d3f69047d3f755bbd3f85cead3f95fa1d3fa6108d3fb6b32d3fc72f1d3fd80b2d3fe8a89d4a16d74d4a25bd3d4a388d5d4a49884d4a58c6bd4a69a6dd4a79e33d4a86e0ad4a951a4d4aa5143d4ab57a3d4ac8881d4ad539fd4ae63f4d4af8f95d4b056edd4b15458d4b25706d4b3733fd4b46e90d4b57f18d4b68fdcd4b782d1d4b8613fd4b96028d4ba9662d4bb66f0d4bc7ea6d4bd8d8ad4be8dc3d4bf94a5d4c05cb3d4c17ca4d4c26708d4c360a6d4c49605d4c58018d4c64e91d4c790e7d4c85300d4c99668d4ca5141d4cb8fd0d4cc8574d4cd915dd4ce6655d4cf97f5d4d05b55d4d1531dd4d27838d4d36742d4d4683dd4d554c9d4d6707ed4d75bb0d4d88f7dd4d9518dd4da5728d4db54b1d4dc6512d4dd6682d4de8d5ed4df8d43d4e0810fd4e1846cd4e2906dd4e37cdfd4e451ffd4e585fbd4e667a3d4e765e9d4e86fa1d4e986a4d4ea8e81d4eb566ad4ec9020d4ed7682d4ee7076d4ef71e5d4f08d23d4f162e9d4f25219d4f36cfdd4f48d3cd4f5600ed4f6589ed4f7618ed4f866fed4f98d60d4fa624ed4fb55b3d4fc6e23d4fd672dd4fe8f67d5a194e1d5a295f8d5a37728d5a46805d5a569a8d5a6548bd5a74e4dd5a870b8d5a98bc8d5aa6458d5ab658bd5ac5b85d5ad7a84d5ae503ad5af5be8d5b077bbd5b16be1d5b28a79d5b37c98d5b46cbed5b576cfd5b665a9d5b78f97d5b85d2dd5b95c55d5ba8638d5bb6808d5bc5360d5bd6218d5be7ad9d5bf6e5bd5c07efdd5c16a1fd5c27ae0d5c35f70d5c46f33d5c55f20d5c6638cd5c76da8d5c86756d5c94e08d5ca5e10d5cb8d26d5cc4ed7d5cd80c0d5ce7634d5cf969cd5d062dbd5d1662dd5d2627ed5d36cbcd5d48d75d5d57167d5d67f69d5d75146d5d88087d5d953ecd5da906ed5db6298d5dc54f2d5dd86f0d5de8f99d5df8005d5e09517d5e18517d5e28fd9d5e36d59d5e473cdd5e5659fd5e6771fd5e77504d5e87827d5e981fbd5ea8d1ed5eb9488d5ec4fa6d5ed6795d5ee75b9d5ef8bcad5f09707d5f1632fd5f29547d5f39635d5f484b8d5f56323d5f67741d5f75f81d5f872f0d5f94e89d5fa6014d5fb6574d5fc62efd5fd6b63d5fe653fd6a15e27d6a275c7d6a390d1d6a48bc1d6a5829dd6a6679dd6a7652fd6a85431d6a98718d6aa77e5d6ab80a2d6ac8102d6ad6c41d6ae4e4bd6af7ec7d6b0804cd6b176f4d6b2690dd6b36b96d6b46267d6b5503cd6b64f84d6b75740d6b86307d6b96b62d6ba8dbed6bb53ead6bc65e8d6bd7eb8d6be5fd7d6bf631ad6c063b7d6c181f3d6c281f4d6c37f6ed6c45e1cd6c55cd9d6c65236d6c7667ad6c879e9d6c97a1ad6ca8d28d6cb7099d6cc75d4d6cd6eded6ce6cbbd6cf7a92d6d04e2dd6d176c5d6d25fe0d6d3949fd6d48877d6d57ec8d6d679cdd6d780bfd6d891cdd6d94ef2d6da4f17d6db821fd6dc5468d6dd5dded6de6d32d6df8bccd6e07ca5d6e18f74d6e28098d6e35e1ad6e45492d6e576b1d6e65b99d6e7663cd6e89aa4d6e973e0d6ea682ad6eb86dbd6ec6731d6ed732ad6ee8bf8d6ef8bdbd6f09010d6f17af9d6f270dbd6f3716ed6f462c4d6f577a9d6f65631d6f74e3bd6f88457d6f967f1d6fa52a9d6fb86c0d6fc8d2ed6fd94f8d6fe7b51d7a14f4fd7a26ce8d7a3795dd7a49a7bd7a56293d7a6722ad7a762fdd7a84e13d7a97816d7aa8f6cd7ab64b0d7ac8d5ad7ad7bc6d7ae6869d7af5e84d7b088c5d7b15986d7b2649ed7b358eed7b472b6d7b5690ed7b69525d7b78ffdd7b88d58d7b95760d7ba7f00d7bb8c06d7bc51c6d7bd6349d7be62d9d7bf5353d7c0684cd7c17422d7c28301d7c3914cd7c45544d7c57740d7c6707cd7c76d4ad7c85179d7c954a8d7ca8d44d7cb59ffd7cc6ecbd7cd6dc4d7ce5b5cd7cf7d2bd7d04ed4d7d17c7dd7d26ed3d7d35b50d7d481ead7d56e0dd7d65b57d7d79b03d7d868d5d7d98e2ad7da5b97d7db7efcd7dc603bd7dd7eb5d7de90b9d7df8d70d7e0594fd7e163cdd7e279dfd7e38db3d7e45352d7e565cfd7e67956d7e78bc5d7e8963bd7e97ec4d7ea94bbd7eb7e82d7ec5634d7ed9189d7ee6700d7ef7f6ad7f05c0ad7f19075d7f26628d7f35de6d7f44f50d7f567ded7f6505ad7f74f5cd7f85750d7f95ea7d8a14e8dd8a24e0cd8a35140d8a44e10d8a55effd8a65345d8a74e15d8a84e98d8a94e1ed8aa9b32d8ab5b6cd8ac5669d8ad4e28d8ae79bad8af4e3fd8b05315d8b14e47d8b2592dd8b3723bd8b4536ed8b56c10d8b656dfd8b780e4d8b89997d8b96bd3d8ba777ed8bb9f17d8bc4e36d8bd4e9fd8be9f10d8bf4e5cd8c04e69d8c14e93d8c28288d8c35b5bd8c4556cd8c5560fd8c64ec4d8c7538dd8c8539dd8c953a3d8ca53a5d8cb53aed8cc9765d8cd8d5dd8ce531ad8cf53f5d8d05326d8d1532ed8d2533ed8d38d5cd8d45366d8d55363d8d65202d8d75208d8d8520ed8d9522dd8da5233d8db523fd8dc5240d8dd524cd8de525ed8df5261d8e0525cd8e184afd8e2527dd8e35282d8e45281d8e55290d8e65293d8e75182d8e87f54d8e94ebbd8ea4ec3d8eb4ec9d8ec4ec2d8ed4ee8d8ee4ee1d8ef4eebd8f04eded8f14f1bd8f24ef3d8f34f22d8f44f64d8f54ef5d8f64f25d8f74f27d8f84f09d8f94f2bd8fa4f5ed8fb4f67d8fc6538d8fd4f5ad8fe4f5dd9a14f5fd9a24f57d9a34f32d9a44f3dd9a54f76d9a64f74d9a74f91d9a84f89d9a94f83d9aa4f8fd9ab4f7ed9ac4f7bd9ad4faad9ae4f7cd9af4facd9b04f94d9b14fe6d9b24fe8d9b34fead9b44fc5d9b54fdad9b64fe3d9b74fdcd9b84fd1d9b94fdfd9ba4ff8d9bb5029d9bc504cd9bd4ff3d9be502cd9bf500fd9c0502ed9c1502dd9c24ffed9c3501cd9c4500cd9c55025d9c65028d9c7507ed9c85043d9c95055d9ca5048d9cb504ed9cc506cd9cd507bd9ce50a5d9cf50a7d9d050a9d9d150bad9d250d6d9d35106d9d450edd9d550ecd9d650e6d9d750eed9d85107d9d9510bd9da4eddd9db6c3dd9dc4f58d9dd4f65d9de4fced9df9fa0d9e06c46d9e17c74d9e2516ed9e35dfdd9e49ec9d9e59998d9e65181d9e75914d9e852f9d9e9530dd9ea8a07d9eb5310d9ec51ebd9ed5919d9ee5155d9ef4ea0d9f05156d9f14eb3d9f2886ed9f388a4d9f44eb5d9f58114d9f688d2d9f77980d9f85b34d9f98803d9fa7fb8d9fb51abd9fc51b1d9fd51bdd9fe51bcdaa151c7daa25196daa351a2daa451a5daa58ba0daa68ba6daa78ba7daa88baadaa98bb4daaa8bb5daab8bb7daac8bc2daad8bc3daae8bcbdaaf8bcfdab08bcedab18bd2dab28bd3dab38bd4dab48bd6dab58bd8dab68bd9dab78bdcdab88bdfdab98be0daba8be4dabb8be8dabc8be9dabd8beedabe8bf0dabf8bf3dac08bf6dac18bf9dac28bfcdac38bffdac48c00dac58c02dac68c04dac78c07dac88c0cdac98c0fdaca8c11dacb8c12dacc8c14dacd8c15dace8c16dacf8c19dad08c1bdad18c18dad28c1ddad38c1fdad48c20dad58c21dad68c25dad78c27dad88c2adad98c2bdada8c2edadb8c2fdadc8c32dadd8c33dade8c35dadf8c36dae05369dae1537adae2961ddae39622dae49621dae59631dae6962adae7963ddae8963cdae99642daea9649daeb9654daec965fdaed9667daee966cdaef9672daf09674daf19688daf2968ddaf39697daf496b0daf59097daf6909bdaf7909ddaf89099daf990acdafa90a1dafb90b4dafc90b3dafd90b6dafe90badba190b8dba290b0dba390cfdba490c5dba590bedba690d0dba790c4dba890c7dba990d3dbaa90e6dbab90e2dbac90dcdbad90d7dbae90dbdbaf90ebdbb090efdbb190fedbb29104dbb39122dbb4911edbb59123dbb69131dbb7912fdbb89139dbb99143dbba9146dbbb520ddbbc5942dbbd52a2dbbe52acdbbf52addbc052bedbc154ffdbc252d0dbc352d6dbc452f0dbc553dfdbc671eedbc777cddbc85ef4dbc951f5dbca51fcdbcb9b2fdbcc53b6dbcd5f01dbce755adbcf5defdbd0574cdbd157a9dbd257a1dbd3587edbd458bcdbd558c5dbd658d1dbd75729dbd8572cdbd9572adbda5733dbdb5739dbdc572edbdd572fdbde575cdbdf573bdbe05742dbe15769dbe25785dbe3576bdbe45786dbe5577cdbe6577bdbe75768dbe8576ddbe95776dbea5773dbeb57addbec57a4dbed578cdbee57b2dbef57cfdbf057a7dbf157b4dbf25793dbf357a0dbf457d5dbf557d8dbf657dadbf757d9dbf857d2dbf957b8dbfa57f4dbfb57efdbfc57f8dbfd57e4dbfe57dddca1580bdca2580ddca357fddca457eddca55800dca6581edca75819dca85844dca95820dcaa5865dcab586cdcac5881dcad5889dcae589adcaf5880dcb099a8dcb19f19dcb261ffdcb38279dcb4827ddcb5827fdcb6828fdcb7828adcb882a8dcb98284dcba828edcbb8291dcbc8297dcbd8299dcbe82abdcbf82b8dcc082bedcc182b0dcc282c8dcc382cadcc482e3dcc58298dcc682b7dcc782aedcc882cbdcc982ccdcca82c1dccb82a9dccc82b4dccd82a1dcce82aadccf829fdcd082c4dcd182cedcd282a4dcd382e1dcd48309dcd582f7dcd682e4dcd7830fdcd88307dcd982dcdcda82f4dcdb82d2dcdc82d8dcdd830cdcde82fbdcdf82d3dce08311dce1831adce28306dce38314dce48315dce582e0dce682d5dce7831cdce88351dce9835bdcea835cdceb8308dcec8392dced833cdcee8334dcef8331dcf0839bdcf1835edcf2832fdcf3834fdcf48347dcf58343dcf6835fdcf78340dcf88317dcf98360dcfa832ddcfb833adcfc8333dcfd8366dcfe8365dda18368dda2831bdda38369dda4836cdda5836adda6836ddda7836edda883b0dda98378ddaa83b3ddab83b4ddac83a0ddad83aaddae8393ddaf839cddb08385ddb1837cddb283b6ddb383a9ddb4837dddb583b8ddb6837bddb78398ddb8839eddb983a8ddba83baddbb83bcddbc83c1ddbd8401ddbe83e5ddbf83d8ddc05807ddc18418ddc2840bddc383ddddc483fdddc583d6ddc6841cddc78438ddc88411ddc98406ddca83d4ddcb83dfddcc840fddcd8403ddce83f8ddcf83f9ddd083eaddd183c5ddd283c0ddd38426ddd483f0ddd583e1ddd6845cddd78451ddd8845addd98459ddda8473dddb8487dddc8488dddd847addde8489dddf8478dde0843cdde18446dde28469dde38476dde4848cdde5848edde68431dde7846ddde884c1dde984cdddea84d0ddeb84e6ddec84bddded84d3ddee84caddef84bfddf084baddf184e0ddf284a1ddf384b9ddf484b4ddf58497ddf684e5ddf784e3ddf8850cddf9750dddfa8538ddfb84f0ddfc8539ddfd851fddfe853adea18556dea2853bdea384ffdea484fcdea58559dea68548dea78568dea88564dea9855edeaa857adeab77a2deac8543dead8572deae857bdeaf85a4deb085a8deb18587deb2858fdeb38579deb485aedeb5859cdeb68585deb785b9deb885b7deb985b0deba85d3debb85c1debc85dcdebd85ffdebe8627debf8605dec08629dec18616dec2863cdec35efedec45f08dec5593cdec65941dec78037dec85955dec9595adeca5958decb530fdecc5c22decd5c25dece5c2cdecf5c34ded0624cded1626aded2629fded362bbded462caded562daded662d7ded762eeded86322ded962f6deda6339dedb634bdedc6343dedd63addede63f6dedf6371dee0637adee1638edee263b4dee3636ddee463acdee5638adee66369dee763aedee863bcdee963f2deea63f8deeb63e0deec63ffdeed63c4deee63dedeef63cedef06452def163c6def263bedef36445def46441def5640bdef6641bdef76420def8640cdef96426defa6421defb645edefc6484defd646ddefe6496dfa1647adfa264b7dfa364b8dfa46499dfa564badfa664c0dfa764d0dfa864d7dfa964e4dfaa64e2dfab6509dfac6525dfad652edfae5f0bdfaf5fd2dfb07519dfb15f11dfb2535fdfb353f1dfb453fddfb553e9dfb653e8dfb753fbdfb85412dfb95416dfba5406dfbb544bdfbc5452dfbd5453dfbe5454dfbf5456dfc05443dfc15421dfc25457dfc35459dfc45423dfc55432dfc65482dfc75494dfc85477dfc95471dfca5464dfcb549adfcc549bdfcd5484dfce5476dfcf5466dfd0549ddfd154d0dfd254addfd354c2dfd454b4dfd554d2dfd654a7dfd754a6dfd854d3dfd954d4dfda5472dfdb54a3dfdc54d5dfdd54bbdfde54bfdfdf54ccdfe054d9dfe154dadfe254dcdfe354a9dfe454aadfe554a4dfe654dddfe754cfdfe854dedfe9551bdfea54e7dfeb5520dfec54fddfed5514dfee54f3dfef5522dff05523dff1550fdff25511dff35527dff4552adff55567dff6558fdff755b5dff85549dff9556ddffa5541dffb5555dffc553fdffd5550dffe553ce0a15537e0a25556e0a35575e0a45576e0a55577e0a65533e0a75530e0a8555ce0a9558be0aa55d2e0ab5583e0ac55b1e0ad55b9e0ae5588e0af5581e0b0559fe0b1557ee0b255d6e0b35591e0b4557be0b555dfe0b655bde0b755bee0b85594e0b95599e0ba55eae0bb55f7e0bc55c9e0bd561fe0be55d1e0bf55ebe0c055ece0c155d4e0c255e6e0c355dde0c455c4e0c555efe0c655e5e0c755f2e0c855f3e0c955cce0ca55cde0cb55e8e0cc55f5e0cd55e4e0ce8f94e0cf561ee0d05608e0d1560ce0d25601e0d35624e0d45623e0d555fee0d65600e0d75627e0d8562de0d95658e0da5639e0db5657e0dc562ce0dd564de0de5662e0df5659e0e0565ce0e1564ce0e25654e0e35686e0e45664e0e55671e0e6566be0e7567be0e8567ce0e95685e0ea5693e0eb56afe0ec56d4e0ed56d7e0ee56dde0ef56e1e0f056f5e0f156ebe0f256f9e0f356ffe0f45704e0f5570ae0f65709e0f7571ce0f85e0fe0f95e19e0fa5e14e0fb5e11e0fc5e31e0fd5e3be0fe5e3ce1a15e37e1a25e44e1a35e54e1a45e5be1a55e5ee1a65e61e1a75c8ce1a85c7ae1a95c8de1aa5c90e1ab5c96e1ac5c88e1ad5c98e1ae5c99e1af5c91e1b05c9ae1b15c9ce1b25cb5e1b35ca2e1b45cbde1b55cace1b65cabe1b75cb1e1b85ca3e1b95cc1e1ba5cb7e1bb5cc4e1bc5cd2e1bd5ce4e1be5ccbe1bf5ce5e1c05d02e1c15d03e1c25d27e1c35d26e1c45d2ee1c55d24e1c65d1ee1c75d06e1c85d1be1c95d58e1ca5d3ee1cb5d34e1cc5d3de1cd5d6ce1ce5d5be1cf5d6fe1d05d5de1d15d6be1d25d4be1d35d4ae1d45d69e1d55d74e1d65d82e1d75d99e1d85d9de1d98c73e1da5db7e1db5dc5e1dc5f73e1dd5f77e1de5f82e1df5f87e1e05f89e1e15f8ce1e25f95e1e35f99e1e45f9ce1e55fa8e1e65fade1e75fb5e1e85fbce1e98862e1ea5f61e1eb72ade1ec72b0e1ed72b4e1ee72b7e1ef72b8e1f072c3e1f172c1e1f272cee1f372cde1f472d2e1f572e8e1f672efe1f772e9e1f872f2e1f972f4e1fa72f7e1fb7301e1fc72f3e1fd7303e1fe72fae2a172fbe2a27317e2a37313e2a47321e2a5730ae2a6731ee2a7731de2a87315e2a97322e2aa7339e2ab7325e2ac732ce2ad7338e2ae7331e2af7350e2b0734de2b17357e2b27360e2b3736ce2b4736fe2b5737ee2b6821be2b75925e2b898e7e2b95924e2ba5902e2bb9963e2bc9967e2bd9968e2be9969e2bf996ae2c0996be2c1996ce2c29974e2c39977e2c4997de2c59980e2c69984e2c79987e2c8998ae2c9998de2ca9990e2cb9991e2cc9993e2cd9994e2ce9995e2cf5e80e2d05e91e2d15e8be2d25e96e2d35ea5e2d45ea0e2d55eb9e2d65eb5e2d75ebee2d85eb3e2d98d53e2da5ed2e2db5ed1e2dc5edbe2dd5ee8e2de5eeae2df81bae2e05fc4e2e15fc9e2e25fd6e2e35fcfe2e46003e2e55feee2e66004e2e75fe1e2e85fe4e2e95ffee2ea6005e2eb6006e2ec5feae2ed5fede2ee5ff8e2ef6019e2f06035e2f16026e2f2601be2f3600fe2f4600de2f56029e2f6602be2f7600ae2f8603fe2f96021e2fa6078e2fb6079e2fc607be2fd607ae2fe6042e3a1606ae3a2607de3a36096e3a4609ae3a560ade3a6609de3a76083e3a86092e3a9608ce3aa609be3ab60ece3ac60bbe3ad60b1e3ae60dde3af60d8e3b060c6e3b160dae3b260b4e3b36120e3b46126e3b56115e3b66123e3b760f4e3b86100e3b9610ee3ba612be3bb614ae3bc6175e3bd61ace3be6194e3bf61a7e3c061b7e3c161d4e3c261f5e3c35fdde3c496b3e3c595e9e3c695ebe3c795f1e3c895f3e3c995f5e3ca95f6e3cb95fce3cc95fee3cd9603e3ce9604e3cf9606e3d09608e3d1960ae3d2960be3d3960ce3d4960de3d5960fe3d69612e3d79615e3d89616e3d99617e3da9619e3db961ae3dc4e2ce3dd723fe3de6215e3df6c35e3e06c54e3e16c5ce3e26c4ae3e36ca3e3e46c85e3e56c90e3e66c94e3e76c8ce3e86c68e3e96c69e3ea6c74e3eb6c76e3ec6c86e3ed6ca9e3ee6cd0e3ef6cd4e3f06cade3f16cf7e3f26cf8e3f36cf1e3f46cd7e3f56cb2e3f66ce0e3f76cd6e3f86cfae3f96cebe3fa6ceee3fb6cb1e3fc6cd3e3fd6cefe3fe6cfee4a16d39e4a26d27e4a36d0ce4a46d43e4a56d48e4a66d07e4a76d04e4a86d19e4a96d0ee4aa6d2be4ab6d4de4ac6d2ee4ad6d35e4ae6d1ae4af6d4fe4b06d52e4b16d54e4b26d33e4b36d91e4b46d6fe4b56d9ee4b66da0e4b76d5ee4b86d93e4b96d94e4ba6d5ce4bb6d60e4bc6d7ce4bd6d63e4be6e1ae4bf6dc7e4c06dc5e4c16ddee4c26e0ee4c36dbfe4c46de0e4c56e11e4c66de6e4c76ddde4c86dd9e4c96e16e4ca6dabe4cb6e0ce4cc6daee4cd6e2be4ce6e6ee4cf6e4ee4d06e6be4d16eb2e4d26e5fe4d36e86e4d46e53e4d56e54e4d66e32e4d76e25e4d86e44e4d96edfe4da6eb1e4db6e98e4dc6ee0e4dd6f2de4de6ee2e4df6ea5e4e06ea7e4e16ebde4e26ebbe4e36eb7e4e46ed7e4e56eb4e4e66ecfe4e76e8fe4e86ec2e4e96e9fe4ea6f62e4eb6f46e4ec6f47e4ed6f24e4ee6f15e4ef6ef9e4f06f2fe4f16f36e4f26f4be4f36f74e4f46f2ae4f56f09e4f66f29e4f76f89e4f86f8de4f96f8ce4fa6f78e4fb6f72e4fc6f7ce4fd6f7ae4fe6fd1e5a16fc9e5a26fa7e5a36fb9e5a46fb6e5a56fc2e5a66fe1e5a76feee5a86fdee5a96fe0e5aa6fefe5ab701ae5ac7023e5ad701be5ae7039e5af7035e5b0704fe5b1705ee5b25b80e5b35b84e5b45b95e5b55b93e5b65ba5e5b75bb8e5b8752fe5b99a9ee5ba6434e5bb5be4e5bc5beee5bd8930e5be5bf0e5bf8e47e5c08b07e5c18fb6e5c28fd3e5c38fd5e5c48fe5e5c58feee5c68fe4e5c78fe9e5c88fe6e5c98ff3e5ca8fe8e5cb9005e5cc9004e5cd900be5ce9026e5cf9011e5d0900de5d19016e5d29021e5d39035e5d49036e5d5902de5d6902fe5d79044e5d89051e5d99052e5da9050e5db9068e5dc9058e5dd9062e5de905be5df66b9e5e09074e5e1907de5e29082e5e39088e5e49083e5e5908be5e65f50e5e75f57e5e85f56e5e95f58e5ea5c3be5eb54abe5ec5c50e5ed5c59e5ee5b71e5ef5c63e5f05c66e5f17fbce5f25f2ae5f35f29e5f45f2de5f58274e5f65f3ce5f79b3be5f85c6ee5f95981e5fa5983e5fb598de5fc59a9e5fd59aae5fe59a3e6a15997e6a259cae6a359abe6a4599ee6a559a4e6a659d2e6a759b2e6a859afe6a959d7e6aa59bee6ab5a05e6ac5a06e6ad59dde6ae5a08e6af59e3e6b059d8e6b159f9e6b25a0ce6b35a09e6b45a32e6b55a34e6b65a11e6b75a23e6b85a13e6b95a40e6ba5a67e6bb5a4ae6bc5a55e6bd5a3ce6be5a62e6bf5a75e6c080ece6c15aaae6c25a9be6c35a77e6c45a7ae6c55abee6c65aebe6c75ab2e6c85ad2e6c95ad4e6ca5ab8e6cb5ae0e6cc5ae3e6cd5af1e6ce5ad6e6cf5ae6e6d05ad8e6d15adce6d25b09e6d35b17e6d45b16e6d55b32e6d65b37e6d75b40e6d85c15e6d95c1ce6da5b5ae6db5b65e6dc5b73e6dd5b51e6de5b53e6df5b62e6e09a75e6e19a77e6e29a78e6e39a7ae6e49a7fe6e59a7de6e69a80e6e79a81e6e89a85e6e99a88e6ea9a8ae6eb9a90e6ec9a92e6ed9a93e6ee9a96e6ef9a98e6f09a9be6f19a9ce6f29a9de6f39a9fe6f49aa0e6f59aa2e6f69aa3e6f79aa5e6f89aa7e6f97e9fe6fa7ea1e6fb7ea3e6fc7ea5e6fd7ea8e6fe7ea9e7a17eade7a27eb0e7a37ebee7a47ec0e7a57ec1e7a67ec2e7a77ec9e7a87ecbe7a97ecce7aa7ed0e7ab7ed4e7ac7ed7e7ad7edbe7ae7ee0e7af7ee1e7b07ee8e7b17eebe7b27eeee7b37eefe7b47ef1e7b57ef2e7b67f0de7b77ef6e7b87efae7b97efbe7ba7efee7bb7f01e7bc7f02e7bd7f03e7be7f07e7bf7f08e7c07f0be7c17f0ce7c27f0fe7c37f11e7c47f12e7c57f17e7c67f19e7c77f1ce7c87f1be7c97f1fe7ca7f21e7cb7f22e7cc7f23e7cd7f24e7ce7f25e7cf7f26e7d07f27e7d17f2ae7d27f2be7d37f2ce7d47f2de7d57f2fe7d67f30e7d77f31e7d87f32e7d97f33e7da7f35e7db5e7ae7dc757fe7dd5ddbe7de753ee7df9095e7e0738ee7e17391e7e273aee7e373a2e7e4739fe7e573cfe7e673c2e7e773d1e7e873b7e7e973b3e7ea73c0e7eb73c9e7ec73c8e7ed73e5e7ee73d9e7ef987ce7f0740ae7f173e9e7f273e7e7f373dee7f473bae7f573f2e7f6740fe7f7742ae7f8745be7f97426e7fa7425e7fb7428e7fc7430e7fd742ee7fe742ce8a1741be8a2741ae8a37441e8a4745ce8a57457e8a67455e8a77459e8a87477e8a9746de8aa747ee8ab749ce8ac748ee8ad7480e8ae7481e8af7487e8b0748be8b1749ee8b274a8e8b374a9e8b47490e8b574a7e8b674d2e8b774bae8b897eae8b997ebe8ba97ece8bb674ce8bc6753e8bd675ee8be6748e8bf6769e8c067a5e8c16787e8c2676ae8c36773e8c46798e8c567a7e8c66775e8c767a8e8c8679ee8c967ade8ca678be8cb6777e8cc677ce8cd67f0e8ce6809e8cf67d8e8d0680ae8d167e9e8d267b0e8d3680ce8d467d9e8d567b5e8d667dae8d767b3e8d867dde8d96800e8da67c3e8db67b8e8dc67e2e8dd680ee8de67c1e8df67fde8e06832e8e16833e8e26860e8e36861e8e4684ee8e56862e8e66844e8e76864e8e86883e8e9681de8ea6855e8eb6866e8ec6841e8ed6867e8ee6840e8ef683ee8f0684ae8f16849e8f26829e8f368b5e8f4688fe8f56874e8f66877e8f76893e8f8686be8f968c2e8fa696ee8fb68fce8fc691fe8fd6920e8fe68f9e9a16924e9a268f0e9a3690be9a46901e9a56957e9a668e3e9a76910e9a86971e9a96939e9aa6960e9ab6942e9ac695de9ad6984e9ae696be9af6980e9b06998e9b16978e9b26934e9b369cce9b46987e9b56988e9b669cee9b76989e9b86966e9b96963e9ba6979e9bb699be9bc69a7e9bd69bbe9be69abe9bf69ade9c069d4e9c169b1e9c269c1e9c369cae9c469dfe9c56995e9c669e0e9c7698de9c869ffe9c96a2fe9ca69ede9cb6a17e9cc6a18e9cd6a65e9ce69f2e9cf6a44e9d06a3ee9d16aa0e9d26a50e9d36a5be9d46a35e9d56a8ee9d66a79e9d76a3de9d86a28e9d96a58e9da6a7ce9db6a91e9dc6a90e9dd6aa9e9de6a97e9df6aabe9e07337e9e17352e9e26b81e9e36b82e9e46b87e9e56b84e9e66b92e9e76b93e9e86b8de9e96b9ae9ea6b9be9eb6ba1e9ec6baae9ed8f6be9ee8f6de9ef8f71e9f08f72e9f18f73e9f28f75e9f38f76e9f48f78e9f58f77e9f68f79e9f78f7ae9f88f7ce9f98f7ee9fa8f81e9fb8f82e9fc8f84e9fd8f87e9fe8f8beaa18f8deaa28f8eeaa38f8feaa48f98eaa58f9aeaa68eceeaa7620beaa86217eaa9621beaaa621feaab6222eaac6221eaad6225eaae6224eaaf622ceab081e7eab174efeab274f4eab374ffeab4750feab57511eab67513eab76534eab865eeeab965efeaba65f0eabb660aeabc6619eabd6772eabe6603eabf6615eac06600eac17085eac266f7eac3661deac46634eac56631eac66636eac76635eac88006eac9665feaca6654eacb6641eacc664feacd6656eace6661eacf6657ead06677ead16684ead2668cead366a7ead4669dead566beead666dbead766dcead866e6ead966e9eada8d32eadb8d33eadc8d36eadd8d3beade8d3deadf8d40eae08d45eae18d46eae28d48eae38d49eae48d47eae58d4deae68d55eae78d59eae889c7eae989caeaea89cbeaeb89cceaec89ceeaed89cfeaee89d0eaef89d1eaf0726eeaf1729feaf2725deaf37266eaf4726feaf5727eeaf6727feaf77284eaf8728beaf9728deafa728feafb7292eafc6308eafd6332eafe63b0eba1643feba264d8eba38004eba46beaeba56bf3eba66bfdeba76bf5eba86bf9eba96c05ebaa6c07ebab6c06ebac6c0debad6c15ebae6c18ebaf6c19ebb06c1aebb16c21ebb26c29ebb36c24ebb46c2aebb56c32ebb66535ebb76555ebb8656bebb9724debba7252ebbb7256ebbc7230ebbd8662ebbe5216ebbf809febc0809cebc18093ebc280bcebc3670aebc480bdebc580b1ebc680abebc780adebc880b4ebc980b7ebca80e7ebcb80e8ebcc80e9ebcd80eaebce80dbebcf80c2ebd080c4ebd180d9ebd280cdebd380d7ebd46710ebd580ddebd680ebebd780f1ebd880f4ebd980edebda810debdb810eebdc80f2ebdd80fcebde6715ebdf8112ebe08c5aebe18136ebe2811eebe3812cebe48118ebe58132ebe68148ebe7814cebe88153ebe98174ebea8159ebeb815aebec8171ebed8160ebee8169ebef817cebf0817debf1816debf28167ebf3584debf45ab5ebf58188ebf68182ebf78191ebf86ed5ebf981a3ebfa81aaebfb81ccebfc6726ebfd81caebfe81bbeca181c1eca281a6eca36b24eca46b37eca56b39eca66b43eca76b46eca86b59eca998d1ecaa98d2ecab98d3ecac98d5ecad98d9ecae98daecaf6bb3ecb05f40ecb16bc2ecb289f3ecb36590ecb49f51ecb56593ecb665bcecb765c6ecb865c4ecb965c3ecba65ccecbb65ceecbc65d2ecbd65d6ecbe7080ecbf709cecc07096ecc1709decc270bbecc370c0ecc470b7ecc570abecc670b1ecc770e8ecc870caecc97110ecca7113eccb7116eccc712feccd7131ecce7173eccf715cecd07168ecd17145ecd27172ecd3714aecd47178ecd5717aecd67198ecd771b3ecd871b5ecd971a8ecda71a0ecdb71e0ecdc71d4ecdd71e7ecde71f9ecdf721dece07228ece1706cece27118ece37166ece471b9ece5623eece6623dece76243ece86248ece96249ecea793beceb7940ecec7946eced7949ecee795becef795cecf07953ecf1795aecf27962ecf37957ecf47960ecf5796fecf67967ecf7797aecf87985ecf9798aecfa799aecfb79a7ecfc79b3ecfd5fd1ecfe5fd0eda1603ceda2605deda3605aeda46067eda56041eda66059eda76063eda860abeda96106edaa610dedab615dedac61a9edad619dedae61cbedaf61d1edb06206edb18080edb2807fedb36c93edb46cf6edb56dfcedb677f6edb777f8edb87800edb97809edba7817edbb7818edbc7811edbd65abedbe782dedbf781cedc0781dedc17839edc2783aedc3783bedc4781fedc5783cedc67825edc7782cedc87823edc97829edca784eedcb786dedcc7856edcd7857edce7826edcf7850edd07847edd1784cedd2786aedd3789bedd47893edd5789aedd67887edd7789cedd878a1edd978a3edda78b2eddb78b9eddc78a5eddd78d4edde78d9eddf78c9ede078ecede178f2ede27905ede378f4ede47913ede57924ede6791eede77934ede89f9bede99ef9edea9efbedeb9efcedec76f1eded7704edee770dedef76f9edf07707edf17708edf2771aedf37722edf47719edf5772dedf67726edf77735edf87738edf97750edfa7751edfb7747edfc7743edfd775aedfe7768eea17762eea27765eea3777feea4778deea5777deea67780eea7778ceea87791eea9779feeaa77a0eeab77b0eeac77b5eead77bdeeae753aeeaf7540eeb0754eeeb1754beeb27548eeb3755beeb47572eeb57579eeb67583eeb77f58eeb87f61eeb97f5feeba8a48eebb7f68eebc7f74eebd7f71eebe7f79eebf7f81eec07f7eeec176cdeec276e5eec38832eec49485eec59486eec69487eec7948beec8948aeec9948ceeca948deecb948feecc9490eecd9494eece9497eecf9495eed0949aeed1949beed2949ceed394a3eed494a4eed594abeed694aaeed794adeed894aceed994afeeda94b0eedb94b2eedc94b4eedd94b6eede94b7eedf94b8eee094b9eee194baeee294bceee394bdeee494bfeee594c4eee694c8eee794c9eee894caeee994cbeeea94cceeeb94cdeeec94ceeeed94d0eeee94d1eeef94d2eef094d5eef194d6eef294d7eef394d9eef494d8eef594dbeef694deeef794dfeef894e0eef994e2eefa94e4eefb94e5eefc94e7eefd94e8eefe94eaefa194e9efa294ebefa394eeefa494efefa594f3efa694f4efa794f5efa894f7efa994f9efaa94fcefab94fdefac94ffefad9503efae9502efaf9506efb09507efb19509efb2950aefb3950defb4950eefb5950fefb69512efb79513efb89514efb99515efba9516efbb9518efbc951befbd951defbe951eefbf951fefc09522efc1952aefc2952befc39529efc4952cefc59531efc69532efc79534efc89536efc99537efca9538efcb953cefcc953eefcd953fefce9542efcf9535efd09544efd19545efd29546efd39549efd4954cefd5954eefd6954fefd79552efd89553efd99554efda9556efdb9557efdc9558efdd9559efde955befdf955eefe0955fefe1955defe29561efe39562efe49564efe59565efe69566efe79567efe89568efe99569efea956aefeb956befec956cefed956fefee9571efef9572eff09573eff1953aeff277e7eff377eceff496c9eff579d5eff679edeff779e3eff879ebeff97a06effa5d47effb7a03effc7a02effd7a1eeffe7a14f0a17a39f0a27a37f0a37a51f0a49ecff0a599a5f0a67a70f0a77688f0a8768ef0a97693f0aa7699f0ab76a4f0ac74def0ad74e0f0ae752cf0af9e20f0b09e22f0b19e28f0b29e29f0b39e2af0b49e2bf0b59e2cf0b69e32f0b79e31f0b89e36f0b99e38f0ba9e37f0bb9e39f0bc9e3af0bd9e3ef0be9e41f0bf9e42f0c09e44f0c19e46f0c29e47f0c39e48f0c49e49f0c59e4bf0c69e4cf0c79e4ef0c89e51f0c99e55f0ca9e57f0cb9e5af0cc9e5bf0cd9e5cf0ce9e5ef0cf9e63f0d09e66f0d19e67f0d29e68f0d39e69f0d49e6af0d59e6bf0d69e6cf0d79e71f0d89e6df0d99e73f0da7592f0db7594f0dc7596f0dd75a0f0de759df0df75acf0e075a3f0e175b3f0e275b4f0e375b8f0e475c4f0e575b1f0e675b0f0e775c3f0e875c2f0e975d6f0ea75cdf0eb75e3f0ec75e8f0ed75e6f0ee75e4f0ef75ebf0f075e7f0f17603f0f275f1f0f375fcf0f475fff0f57610f0f67600f0f77605f0f8760cf0f97617f0fa760af0fb7625f0fc7618f0fd7615f0fe7619f1a1761bf1a2763cf1a37622f1a47620f1a57640f1a6762df1a77630f1a8763ff1a97635f1aa7643f1ab763ef1ac7633f1ad764df1ae765ef1af7654f1b0765cf1b17656f1b2766bf1b3766ff1b47fcaf1b57ae6f1b67a78f1b77a79f1b87a80f1b97a86f1ba7a88f1bb7a95f1bc7aa6f1bd7aa0f1be7aacf1bf7aa8f1c07aadf1c17ab3f1c28864f1c38869f1c48872f1c5887df1c6887ff1c78882f1c888a2f1c988c6f1ca88b7f1cb88bcf1cc88c9f1cd88e2f1ce88cef1cf88e3f1d088e5f1d188f1f1d2891af1d388fcf1d488e8f1d588fef1d688f0f1d78921f1d88919f1d98913f1da891bf1db890af1dc8934f1dd892bf1de8936f1df8941f1e08966f1e1897bf1e2758bf1e380e5f1e476b2f1e576b4f1e677dcf1e78012f1e88014f1e98016f1ea801cf1eb8020f1ec8022f1ed8025f1ee8026f1ef8027f1f08029f1f18028f1f28031f1f3800bf1f48035f1f58043f1f68046f1f7804df1f88052f1f98069f1fa8071f1fb8983f1fc9878f1fd9880f1fe9883f2a19889f2a2988cf2a3988df2a4988ff2a59894f2a6989af2a7989bf2a8989ef2a9989ff2aa98a1f2ab98a2f2ac98a5f2ad98a6f2ae864df2af8654f2b0866cf2b1866ef2b2867ff2b3867af2b4867cf2b5867bf2b686a8f2b7868df2b8868bf2b986acf2ba869df2bb86a7f2bc86a3f2bd86aaf2be8693f2bf86a9f2c086b6f2c186c4f2c286b5f2c386cef2c486b0f2c586baf2c686b1f2c786aff2c886c9f2c986cff2ca86b4f2cb86e9f2cc86f1f2cd86f2f2ce86edf2cf86f3f2d086d0f2d18713f2d286def2d386f4f2d486dff2d586d8f2d686d1f2d78703f2d88707f2d986f8f2da8708f2db870af2dc870df2dd8709f2de8723f2df873bf2e0871ef2e18725f2e2872ef2e3871af2e4873ef2e58748f2e68734f2e78731f2e88729f2e98737f2ea873ff2eb8782f2ec8722f2ed877df2ee877ef2ef877bf2f08760f2f18770f2f2874cf2f3876ef2f4878bf2f58753f2f68763f2f7877cf2f88764f2f98759f2fa8765f2fb8793f2fc87aff2fd87a8f2fe87d2f3a187c6f3a28788f3a38785f3a487adf3a58797f3a68783f3a787abf3a887e5f3a987acf3aa87b5f3ab87b3f3ac87cbf3ad87d3f3ae87bdf3af87d1f3b087c0f3b187caf3b287dbf3b387eaf3b487e0f3b587eef3b68816f3b78813f3b887fef3b9880af3ba881bf3bb8821f3bc8839f3bd883cf3be7f36f3bf7f42f3c07f44f3c17f45f3c28210f3c37afaf3c47afdf3c57b08f3c67b03f3c77b04f3c87b15f3c97b0af3ca7b2bf3cb7b0ff3cc7b47f3cd7b38f3ce7b2af3cf7b19f3d07b2ef3d17b31f3d27b20f3d37b25f3d47b24f3d57b33f3d67b3ef3d77b1ef3d87b58f3d97b5af3da7b45f3db7b75f3dc7b4cf3dd7b5df3de7b60f3df7b6ef3e07b7bf3e17b62f3e27b72f3e37b71f3e47b90f3e57ba6f3e67ba7f3e77bb8f3e87bacf3e97b9df3ea7ba8f3eb7b85f3ec7baaf3ed7b9cf3ee7ba2f3ef7babf3f07bb4f3f17bd1f3f27bc1f3f37bccf3f47bddf3f57bdaf3f67be5f3f77be6f3f87beaf3f97c0cf3fa7bfef3fb7bfcf3fc7c0ff3fd7c16f3fe7c0bf4a17c1ff4a27c2af4a37c26f4a47c38f4a57c41f4a67c40f4a781fef4a88201f4a98202f4aa8204f4ab81ecf4ac8844f4ad8221f4ae8222f4af8223f4b0822df4b1822ff4b28228f4b3822bf4b48238f4b5823bf4b68233f4b78234f4b8823ef4b98244f4ba8249f4bb824bf4bc824ff4bd825af4be825ff4bf8268f4c0887ef4c18885f4c28888f4c388d8f4c488dff4c5895ef4c67f9df4c77f9ff4c87fa7f4c97faff4ca7fb0f4cb7fb2f4cc7c7cf4cd6549f4ce7c91f4cf7c9df4d07c9cf4d17c9ef4d27ca2f4d37cb2f4d47cbcf4d57cbdf4d67cc1f4d77cc7f4d87cccf4d97ccdf4da7cc8f4db7cc5f4dc7cd7f4dd7ce8f4de826ef4df66a8f4e07fbff4e17fcef4e27fd5f4e37fe5f4e47fe1f4e57fe6f4e67fe9f4e77feef4e87ff3f4e97cf8f4ea7d77f4eb7da6f4ec7daef4ed7e47f4ee7e9bf4ef9eb8f4f09eb4f4f18d73f4f28d84f4f38d94f4f48d91f4f58db1f4f68d67f4f78d6df4f88c47f4f98c49f4fa914af4fb9150f4fc914ef4fd914ff4fe9164f5a19162f5a29161f5a39170f5a49169f5a5916ff5a6917df5a7917ef5a89172f5a99174f5aa9179f5ab918cf5ac9185f5ad9190f5ae918df5af9191f5b091a2f5b191a3f5b291aaf5b391adf5b491aef5b591aff5b691b5f5b791b4f5b891baf5b98c55f5ba9e7ef5bb8db8f5bc8debf5bd8e05f5be8e59f5bf8e69f5c08db5f5c18dbff5c28dbcf5c38dbaf5c48dc4f5c58dd6f5c68dd7f5c78ddaf5c88ddef5c98dcef5ca8dcff5cb8ddbf5cc8dc6f5cd8decf5ce8df7f5cf8df8f5d08de3f5d18df9f5d28dfbf5d38de4f5d48e09f5d58dfdf5d68e14f5d78e1df5d88e1ff5d98e2cf5da8e2ef5db8e23f5dc8e2ff5dd8e3af5de8e40f5df8e39f5e08e35f5e18e3df5e28e31f5e38e49f5e48e41f5e58e42f5e68e51f5e78e52f5e88e4af5e98e70f5ea8e76f5eb8e7cf5ec8e6ff5ed8e74f5ee8e85f5ef8e8ff5f08e94f5f18e90f5f28e9cf5f38e9ef5f48c78f5f58c82f5f68c8af5f78c85f5f88c98f5f98c94f5fa659bf5fb89d6f5fc89def5fd89daf5fe89dcf6a189e5f6a289ebf6a389eff6a48a3ef6a58b26f6a69753f6a796e9f6a896f3f6a996eff6aa9706f6ab9701f6ac9708f6ad970ff6ae970ef6af972af6b0972df6b19730f6b2973ef6b39f80f6b49f83f6b59f85f6b69f86f6b79f87f6b89f88f6b99f89f6ba9f8af6bb9f8cf6bc9efef6bd9f0bf6be9f0df6bf96b9f6c096bcf6c196bdf6c296cef6c396d2f6c477bff6c596e0f6c6928ef6c792aef6c892c8f6c9933ef6ca936af6cb93caf6cc938ff6cd943ef6ce946bf6cf9c7ff6d09c82f6d19c85f6d29c86f6d39c87f6d49c88f6d57a23f6d69c8bf6d79c8ef6d89c90f6d99c91f6da9c92f6db9c94f6dc9c95f6dd9c9af6de9c9bf6df9c9ef6e09c9ff6e19ca0f6e29ca1f6e39ca2f6e49ca3f6e59ca5f6e69ca6f6e79ca7f6e89ca8f6e99ca9f6ea9cabf6eb9cadf6ec9caef6ed9cb0f6ee9cb1f6ef9cb2f6f09cb3f6f19cb4f6f29cb5f6f39cb6f6f49cb7f6f59cbaf6f69cbbf6f79cbcf6f89cbdf6f99cc4f6fa9cc5f6fb9cc6f6fc9cc7f6fd9ccaf6fe9ccbf7a19cccf7a29ccdf7a39ccef7a49ccff7a59cd0f7a69cd3f7a79cd4f7a89cd5f7a99cd7f7aa9cd8f7ab9cd9f7ac9cdcf7ad9cddf7ae9cdff7af9ce2f7b0977cf7b19785f7b29791f7b39792f7b49794f7b597aff7b697abf7b797a3f7b897b2f7b997b4f7ba9ab1f7bb9ab0f7bc9ab7f7bd9e58f7be9ab6f7bf9abaf7c09abcf7c19ac1f7c29ac0f7c39ac5f7c49ac2f7c59acbf7c69accf7c79ad1f7c89b45f7c99b43f7ca9b47f7cb9b49f7cc9b48f7cd9b4df7ce9b51f7cf98e8f7d0990df7d1992ef7d29955f7d39954f7d49adff7d59ae1f7d69ae6f7d79aeff7d89aebf7d99afbf7da9aedf7db9af9f7dc9b08f7dd9b0ff7de9b13f7df9b1ff7e09b23f7e19ebdf7e29ebef7e37e3bf7e49e82f7e59e87f7e69e88f7e79e8bf7e89e92f7e993d6f7ea9e9df7eb9e9ff7ec9edbf7ed9edcf7ee9eddf7ef9ee0f7f09edff7f19ee2f7f29ee9f7f39ee7f7f49ee5f7f59eeaf7f69eeff7f79f22f7f89f2cf7f99f2ff7fa9f39f7fb9f37f7fc9f3df7fd9f3ef7fe9f44";
	function GB2312toText(gbtxt){
		var length=gbtxt.length;
		var unitxt="";
		var p=0;
		while(p<length){
			var hkey=gbtxt.substr(p,2);
			if(hkey<"a1"){
				unitxt+=String.fromCharCode(parseInt(hkey,16).toString(10));
				p+=2;
			}else{
				var key=gbtxt.substr(p,4);
				var uni=-1;
				//二分查找
				var left = 0;
				var right= gb2uni.length/8;  
				while(left<=right){  
					var center=Math.floor((left+right)/2);  
					var ckey=gb2uni.substr((center*2)*4,4);
					if(ckey == key) uni = center;  
						if(key < ckey){  
							right = center - 1;
					}else{
						left = center + 1;
					}
				}
				if(uni==-1) ukey=key;
				else ukey=gb2uni.substr((uni*2+1)*4,4);
				unitxt+=unescape("%u"+ukey);
				p+=4;
			}
		}
		return unitxt;
	}
	
	var RenaDecode=function(data,type){		
		var splitData=function(data){
			var NodeArray=new Array();
			var p=0,l=data.length;
			var header=data.substr(data,40);
			p+=40;
			var match=true;
			if(header.substr(0,16)!="ff52656e4c6962ff"){ //0xff,RenLib,0xff
				match=false;
			}
			if(match){
				var major=parseInt(header.substr(16,2),16);
				var minor=parseInt(header.substr(18,2),16);
				if(!(100*major+minor <= 304)){
					alert("版本过高！");
					return NodeArray;
				}
			}else{
				if(header.substr(0,2)!="78"){
					alert("文件格式异常！");
					return NodeArray;
				}else{
					p=0;
				}
			}
			while(p<l){
				var pos="",flag="",comment="",text="";
				var buf,data1,data2;
				data1=data[p]+data[p+1],data2=data[p+2]+data[p+3];
				p+=4;//2字节
				pos=data1;
				flag=parseInt(data2,16);
				if(type=="RenLib" && (flag&1)){ //bit0表示拓展节点
					buf=data[p]+data[p+1]+data[p+2]+data[p+3];
					p+=4;//2字节
					flag=(parseInt(buf,16)<<8)|flag;
				}
				if(type=="RenLib" && (flag&32)){//RenLib旧版注释，以0x80,bit7表示结尾
					var start=p;
					var end=p;
					while(true){
						if(parseInt(data[p]+data[p+1],16)&128)break;
						end+=2;
						if(parseInt(data[p+2]+data[p+3],16)&128)break;
						end+=2;
						p+=4;
					}
					p+=4;
					comment=data.substr(start,end-start+1);
				}else if(flag&8){//Rena和RenLib新版注释，以0结尾
					var start=p;
					var end=p;
					while(true){
						if(data[p]+data[p+1]=="00")break;
						end+=2;
						if(data[p+2]+data[p+3]=="00")break;
						end+=2;
						p+=4;
					}
					p+=4;
					comment=data.substr(start,end-start+1);
				}
				if(flag&256){//RenLib3.6 棋盘文字
					var start=p;
					var end=p;
					while(true){
						if(data[p]+data[p+1]=="00")break;
						end+=2;
						if(data[p+2]+data[p+3]=="00")break;
						end+=2;
						p+=4;
					}
					p+=4;
					text=data.substr(start,end-start+1);
				}
				var list=new Array();
				if(type=="Rena" && (flag&4)){
					//Rena 无棋子的棋盘文字列表，经测试Rena1.20，每个棋盘文字最大2个字节长度。
					//04表示继续，00表示结束。
					while(true){
						var _pos=data[p]+data[p+1];
						p+=2;
						var _text=data[p]+data[p+1]+data[p+2]+data[p+3];
						p+=4;
						list.push({"pos":_pos,"text":GB2312toText(_text)});
						if(data[p]+data[p+1]=="00"){
							p+=2;
							break;
						}
						p+=2;
					}
				}
				NodeArray.push({"pos":pos,"flag":flag,"comment":GB2312toText(comment),"text":GB2312toText(text),"RenaList":list});
			}
			return NodeArray;
		}
		var node=function(){
			return {
				index:0,
				parent:0,
				sons:new Array()
			}
		}
		
		var start=0;
		//儿子是子树的入口，然后逐个兄弟，无兄弟无儿子是子树的结束。
		var buildTree=function(NodeArray){
			var length=NodeArray.length;
			var flags=new Array(length);
			var tree=new Array();
			var p=0;
			var root=new node();
			root.index=-1;//
			root.parent=-1;
			tree.push(root);//tree[0]为附加的超级根节点，用于处理森林的情况
			flags[0]=0;
			var i=0;
			while(i<length){
				var flag= p? flags[p]:0;//根永远有儿子无兄弟
				if(type=="RenLib" && !start && (flag&4))start=p;
				if(!(flag&(1<<6))){//有子节点，进入子树
					var q=new node();
					q.index=i;
					q.parent=p;
					tree.push(q);
					flags[p]|=(1<<6);//儿子已访问
					p=tree.length-1;
					flags[p]=NodeArray[i].flag;
					tree[q.parent].sons.push(p);
					i++;
				}else if(flag&(1<<7)){//有兄弟
					var q=new node();
					q.index=i;
					q.parent=tree[p].parent;
					tree.push(q);
					flags[p]&=~(1<<7);//兄弟已访问
					p=tree.length-1;
					flags[p]=NodeArray[i].flag;
					tree[q.parent].sons.push(p);
					i++;
				}else{//回溯
					while(p && (flags[p]&64)&& !(flags[p]&128)){
						p=tree[p].parent;
					}
				}
			}
			return tree;
		}
		
		var seq=splitData(data);
		var tree=buildTree(seq);
		var flag=0;
		var comment="";
		if(tree[0].sons.length==0)flag|=64;
		else{
			flag|=8;
			comment="共含有"+tree[0].sons.length+"个棋谱";
		}
		tree[0].index=seq.length;
		seq.push({"pos":"00","flag":flag,"comment":comment,"text":"","RenaList":null});//将超级根节点的信息附加在最后
		return {"seq":seq,"tree":tree,"start":start};
	}
	var copy_clip=function(txt) {
        if (window.clipboardData) {
                window.clipboardData.clearData();
                window.clipboardData.setData("Text", txt);
        } else if (navigator.userAgent.indexOf("Opera") != -1) {
                window.location = txt;
        } else if (window.netscape) {
                try {
                        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                } catch (e) {
                        alert("您的firefox安全限制限制您进行剪贴板操作，请在新窗口的地址栏里输入'about:config'然后找到'signed.applets.codebase_principal_support'设置为true'");
                        return false;
                }
                var clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard);
                if (!clip)
                        return;
                var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
                if (!trans)
                        return;
                trans.addDataFlavor('text/unicode');
                var str = new Object();
                var len = new Object();
                var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
                var copytext = txt;
                str.data = copytext;
                trans.setTransferData("text/unicode", str, copytext.length * 2);
                var clipid = Components.interfaces.nsIClipboard;
                if (!clip)
                        return false;
                clip.setData(trans, null, clipid.kGlobalClipboard);
        }
	}
})(jQuery);