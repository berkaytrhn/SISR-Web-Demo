let main = () => {
    const form = document.getElementById("form");
    const inputFile = document.getElementById("fileInput");
    const canvas = document.getElementById("canvas");

    const IMAGE_SIZE=256

    
    let canvas_width=null;
    let canvas_height=null;
    let image_width=null;
    let image_height=null;
    let relative_x=null;
    let relative_y=null;

    let sent=false;
    let is_selected=false;


    let preprocess_image=(image)=>{
        let low_res=Math.ceil(IMAGE_SIZE*0.4)
        let size_l=new cv.Size(low_res, low_res);
        let size_h=new cv.Size(IMAGE_SIZE, IMAGE_SIZE);
        cv.resize(image, image, size_l, 0, 0, cv.INTER_CUBIC);
        cv.resize(image, image, size_h, 0, 0, cv.INTER_CUBIC);
        return image
    }


    let draw_image=(x, y)=>{
        let image=document.getElementById("image");
        let img=cv.imread(image);
        
        let sclr = new cv.Scalar(0, 0, 0, 0);
            
        
        let rect_ = new cv.Rect(
            x-(IMAGE_SIZE/2),
            y-(IMAGE_SIZE/2), 
            IMAGE_SIZE, 
            IMAGE_SIZE
        );
        console.log(rect_);
        let cropped=img.roi(rect_);

        // preprocess image
        cropped=preprocess_image(cropped);

        console.log(img);
        cv.imshow("cropped", cropped);
        //cv.imshow("result_image", cropped);
        cropped.delete();

        // draw rectangle
        cv.rectangle(
            img, 
            new cv.Point(
                x-(IMAGE_SIZE/2),
                y-(IMAGE_SIZE/2)
            ),
            new cv.Point(
                x+(IMAGE_SIZE/2),
                y+(IMAGE_SIZE/2)
            ),
            sclr,
            4
        );

        console.log("draw coords", x, y)
        cv.imshow("canvas",img)
        img.delete();

        
    }   

    let load_image=(image)=>{
        image_width=image.width;
        image_height=image.height;
        let mat = cv.imread(image);

        cv.imshow("canvas", mat);
        mat.delete();
        image.style.display="none";

        let canvas=document.getElementById("canvas").getBoundingClientRect()
        canvas_width=canvas.right-canvas.left;
        canvas_height=canvas.bottom-canvas.top;
    }


    let get_cursor_position=(canvas, event)=>{
        let rect = canvas.getBoundingClientRect()
        let x = event.clientX - rect.left
        let y = event.clientY - rect.top
        return [x, y]
    }


    let calculate_relatives=(x, y)=>{
        relative_x=x*(image_width/canvas_width);
        relative_y=y*(image_height/canvas_height);
        console.log("image size: ", image_width, image_height);
        console.log("canvas size: ", canvas_width, canvas_height);
        console.log("relatives: ",relative_x, relative_y);
        return [relative_x, relative_y]
    }
    

    canvas.addEventListener("mousedown", (e)=>{
        if (!is_selected){
            let res=get_cursor_position(canvas, e);
            let x=res[0];
            let y=res[1];
            console.log("image coordinates", x, y);
            
            let result=calculate_relatives(x, y);
            let rel_x=result[0];
            let rel_y=result[1];
            console.log(image_width, image_height);

            console.log(rel_x, rel_y);
            draw_image(rel_x, rel_y);
        }
    });

    form.addEventListener("input", event => {
        let img = event.target.files[0];
        let image = document.getElementById("image");
        image.src = URL.createObjectURL(img);
        let result = document.getElementById("loading_gif");
        result.innerHTML="";

        //part
        image.onload = () => {
            load_image(image);
        }
    });





    form.addEventListener("submit", event => {
        if(!sent){
            sent=true;
            is_selected=true;
            //console.log(inputFile.files);
            if( inputFile.files.length === 0){
                alert("Please Choose a file!!");
                return;
            }
            set_loading();
            event.preventDefault();

            let endpoint = "http://localhost:5000/upload/";
            let formData = new FormData();

            let cropped_image=document.getElementById("cropped");
            let cropped_data=cropped_image.getContext("2d").getImageData(0,0,IMAGE_SIZE, IMAGE_SIZE)

            let data=JSON.stringify(Array.from(cropped_data.data));
            //formData.append("file", myJsonString);

            upload_image(endpoint, data);
        }
    });

}

let set_loading = () => {
    let result = document.getElementById("loading_gif");
    let gif = document.createElement("img");
    gif.src="loading.gif";
    gif.style.maxHeight= "10%";
    gif.style.maxWidth= "10%";
    gif.style.width="400px";
    gif.style.height="50px";

    console.log(gif);
    let text = document.createElement("p");
    text.style.width="400px";
    text.style.height="50px";
    text.style.fontWeight="bold";
    text.style.textAlign="center";
    text.innerText = "Loading...";
    
    console.log(gif.innerHTML);
    result.appendChild(gif);
    result.appendChild(text);

}


let upload_image = async (endpoint, data) =>{
    await axios.post(
        endpoint, 
        data,
        {
            headers:{
                "Content-Type": "application/json"
            }
        }
    ).then(response => {
        setTimeout(() => {
            handle_response(response.data);
        }, 1500);
    });
}

// silinebilir.
let handle_response = (response) => {
    console.log(response);
    let pred = response.Predicted;
    document.getElementById("result").innerHTML = pred;
}
//result image geldiğinde is_selected=false yap
//result image geldiğinde sent=false yap





main()