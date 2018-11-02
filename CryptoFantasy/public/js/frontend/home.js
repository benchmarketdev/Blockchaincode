$(document).ready(function(){
    doOnDrawCanvasCircle();
    $('.app-home-body').css('height', $(window).height());
    $('#particles-js').attr('height', $('.app-home-body').css('height'));
    $('#particles-js').attr('width', $('.app-home-body').css('width'));


    $('.athlete-card').click(function(event){
        athleteId = $(this).attr('athlete-id');
        if ( athleteId != 'not-allowed' ) {

            $.ajax('/checkownerofathlete/'+athleteId)
                .done(function(resp){
                    if (resp == 'false') {

                        if ( event.target.nodeName.toLowerCase() == 'a' ) {
                            strWarning = "You already own this contract. Please see it in your Dashboard section.";
                            showDialog("CryptoFantasy", strWarning);
                            return;
                        }
                        else {
                            window.location.href='/myathlete/'+athleteId;
                            //window.location.href='/dashboard';
                        }
                    }
                    else {
                        if ( event.target.nodeName.toLowerCase() == 'a' ) {
                            if ( $(event.target).attr('href') != undefined ) {
                                window.open($(event.target).attr('href'), '_blank');
                                //window.location.href = $(event.target).attr('href');
                            }
                            if ( $(event.target)[0].className == "btn-bottom-athlete" ) {
                                window.location.href = $(event.target).attr('a-href');
                            }
                        }
                        else
                            window.location.href='/athlete/'+athleteId;
                    }
                })
                .fail(function(){

                    if ( event.target.nodeName.toLowerCase() == 'a' ) {
                        if ( $(event.target).attr('href') != undefined ) {
                            window.open($(event.target).attr('href'), '_blank');
                            //window.location.href = $(event.target).attr('href');
                        }
                        if ( $(event.target)[0].className == "btn-bottom-athlete" ) {
                            window.location.href = $(event.target).attr('a-href');
                        }
                    }
                    else
                        window.location.href='/athlete/'+athleteId;
                    //window.location.href='/athlete/'+athleteId;
                });
            //$.get('/checkownerofathlete/'+athleteId, function(resp){
            //    if (resp == 'false')
            //        window.location.href=window.origin+'/dashboard';
            //    else
            //        window.location.href=window.origin+'/athlete/'+athleteId;
            //});
        }
    });

});
function showDialog(captionStr, bodyStr) {
    $('#alertmodal_title').html(captionStr);
    $('#alertmodal_body').html(bodyStr);
    $('#alertModal').modal('show');
}
function doOnDrawCanvasCircle() {
    var mainCanvas = document.getElementById("myCanvas");
    var mainContext = mainCanvas.getContext('2d');
    var circles = new Array();
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;
    function Circle(radius, speed, width, xPos, yPos) {
        this.radius = radius;
        this.speed = speed;
        this.width = width;
        this.xPos = xPos;
        this.yPos = yPos;
        this.opacity = Math.random()*1;
        this.counter = 0;
        var signHelper = Math.floor(Math.random() * 2);
        if (signHelper == 1) {
            this.sign = -1;
        } else {
            this.sign = 1;
        }
    }
    Circle.prototype.update = function () {
        this.counter += this.sign * this.speed;
        mainContext.beginPath();
        mainContext.arc(
            this.xPos + Math.cos(this.counter / 100) * this.radius,
            this.yPos + Math.sin(this.counter / 100) * this.radius,
            this.width,
            0,
            Math.PI * 2,
            false
        );
        mainContext.closePath();
        mainContext.fillStyle = 'rgba(255, 255, 255,' + this.opacity + ')';
        mainContext.fill();
    };
    function drawCircles() {
        for (var i = 0; i < 35; i++) {
            var randomAl = (Math.random()*360)*Math.PI*2/360;
            var randomX = 350;
            var randomY = 350;
            var speed = .2 + Math.random() * 0.5;
            var size = 5;
            var circle = new Circle(320, speed, size, randomX, randomY);
            circles.push(circle);
        }
        draw();
    }
    drawCircles();
    function draw() {
        mainContext.clearRect(0, 0, 700, 700);
        mainContext.beginPath();
        mainContext.arc(350,350,320,0,2*Math.PI);
        mainContext.stroke();
        mainContext.strokeStyle = '#FFFFFF33';
        mainContext.lineWidth = 3;
        for (var i = 0; i < circles.length; i++) {
            var myCircle = circles[i];
            myCircle.update();
        }
        requestAnimationFrame(draw);
    }

    Particles.init({
        selector: '#particles-js',
        color: '#888888',
        responsive: true,
        opacity: 0.1,
        maxParticles: 90,
        connectParticles: true,
        sizeVariations: 3,
        speed: 0.3
    });
}