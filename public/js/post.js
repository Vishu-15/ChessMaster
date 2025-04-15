const socket = io();

const currentUserId = document.querySelector('.currentUser').dataset.user;

const likeBtn = document.querySelectorAll(".like-btn");
likeBtn.forEach((button)=>{
    button.addEventListener("click",()=>{
        const postId = button.dataset.postId;
        const userId = button.dataset.userId;
    
        socket.emit("likePost", {postId,userId});
    })
})

socket.on("postLiked", ({ postId, likesCount, userId, liked }) => {
    const postElement = document.querySelector(`#post-${postId}`);
    const likeBtn = postElement.querySelector(".like-btn");
    const likeCountSpan = likeBtn.querySelector("span");

    likeCountSpan.textContent = likesCount;
    
    if (userId === currentUserId) {
        likeBtn.classList.toggle("liked", liked);
    }
});

const commentBtn = document.querySelectorAll('.comment-btn');
commentBtn.forEach((button)=>{
    button.addEventListener("click",()=>{
        const postId = button.dataset.postId;
        const userId = button.dataset.userId;
        const commentInput = button.previousElementSibling;
        const comment = commentInput.value;

        if(comment == '') return;
        
        socket.emit("commentPost", {postId,userId,comment});

        commentInput.value = '';
    })
})

socket.on("commentedOnPost", ({postId,username,comment})=>{
    const postElement = document.querySelector(`#post-${postId}`);
    if(!postElement) return;

    const commentSection = postElement.querySelector('.comments-scroll');
    if(!commentSection) return;

    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");
    commentDiv.innerHTML = `<strong>${username}:</strong> ${comment}`;

    commentSection.prepend(commentDiv);
});