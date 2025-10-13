const paths = [
  {
    "id": 6,
    "img": "7df568129e769a9b67afc491b8a63e3d.jpg"
  },
  {
    "id": 2,
    "img": "eb87e10ac2548faffdd3fdf9d9a5b2ec.png"
  },
  {
    "id": 1,
    "img": "https://3dmadcat.com/app/workout-categories/images/ec8b7b3e084f00e912f9aaa9811dafed.png"
  }
];

for( const path of paths ){
  console.log(`update AppWorkoutCats set img='${ path.img.split('/').pop() }' where id = ${path.id};`);
}