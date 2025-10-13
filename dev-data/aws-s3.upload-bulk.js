const files = [
  {
    "name": "fanta.webp",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/6a5d6344ac60153cbf50fb2f91b0cc0e.webp"
  },
  {
    "name": "coca-cola.jpg",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/2015f114e5a0ecaf98d35c6fcc2fb8a7.jpg"
  },
  {
    "name": "burger.jpg",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/9a67343ddfc7704a723ff6c513a7dfc0.jpg"
  },
  {
    "name": "burger.jpg",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/392d3f27df791c1dfa477a98d2b3fb8b.jpg"
  },
  {
    "name": "burger.jpg",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/04411e1f62114f6d1b66a25c965edce7.jpg"
  },
  {
    "name": "burger.jpg",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/98b88d406c967015e8b737a4a4539d3c.jpg"
  },
  {
    "name": "burger.jpg",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/89ee76ed768a8e6efc90bc82113d7ddd.jpg"
  },
  {
    "name": "fanta.webp",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/34b0fecf83d7021f771aa2624fcbd5b7.webp"
  },
  {
    "name": "coca-cola.jpg",
    "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/f209c0c8a6b4da110f43c14d500b3631.jpg"
  }
];

for( const mFile of files ){
  const fileName = mFile.image.split('/').pop();
  const filePath = `${__dirname}/tmp/${mFile.name}`;
  // console.log({ f: fileName, is: console.isFile(filePath) });
  const uploadRes = await App.S3.upload( filePath, fileName );
  console.json({ uploadRes });
}


const files = [
  '/m-sys/prog/web/apps/morris-armstrong-ii/info/dev-data/images/restos/food-truck-a.jpg',
  '/m-sys/prog/web/apps/morris-armstrong-ii/info/dev-data/images/restos/food-truck-b.jpg',
  '/m-sys/prog/web/apps/morris-armstrong-ii/info/dev-data/images/restos/kfc.jpg',
];

for( const mFile of files ){
  const fileName = mFile.split('/').pop();
  const filePath = mFile;
  // console.log({ f: fileName, is: console.isFile(filePath) });
  const uploadRes = await App.S3.upload( filePath, fileName );
  console.json({ uploadRes });
}


// /m-sys/prog/web/apps/morris-armstrong-ii/info/dev-data/images/driesks/fanta.png