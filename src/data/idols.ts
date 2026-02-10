export interface Idol {
  id: number
  slug: string
  name: string
  name_native?: string
  image?: string
  face?: string
}

export function getIdolImageBySlug(slug: string): string {
  return (
    idols.find(i => i.slug === slug)?.image ??
    '/media/idols/placeholder.jpg'
  )
}

export function getIdolFaceImageBySlug(slug: string): string {
  return (
    idols.find(i => i.slug === slug)?.face ??
    '/media/idols/placeholder.jpg'
  )
}

export function getIdolNameBySlug(slug: string): string {
  return (
    idols.find(i => i.slug === slug)?.name ??
    ''
  )
}



export const idols: Idol[] = [
  {
    id: 1,
    slug: 'kizuki-nao',
    name: 'Nao Kizuki',
    name_native: '城月菜央',
    image: '/media/idols/kizuki-nao_thumb.jpg',
    face: '/media/idols/faces/kizuki-nao.jpg',
  },
  {
    id: 2,
    slug: 'suzumi-su',
    name: 'Su Suzumi',
    name_native: '涼海すう',
    image: '/media/idols/suzumi-su_thumb.jpg',
    face: '/media/idols/faces/suzumi-su.jpg',
  },
  {
    id: 3,
    slug: 'hashimoto-momoko',
    name: 'Momoko Hashimoto',
    name_native: '橋本桃呼',
    image: '/media/idols/hashimoto-momoko_thumb.jpg',
    face: '/media/idols/faces/hashimoto-momoko.jpg',
  },
  {
    id: 4,
    slug: 'hazuki-saara',
    name: 'Saara Hazuki',
    name_native: '葉月紗蘭',
    image: '/media/idols/hazuki-saara_thumb.jpg',
    face: '/media/idols/faces/hazuki-saara.jpg',
  },
  {
    id: 5,
    slug: 'higashiyama-erisa',
    name: 'Erisa Higashiyama',
    name_native: '東山恵里沙',
    image: '/media/idols/higashiyama-erisa_thumb.jpg',
    face: '/media/idols/faces/higashiyama-erisa.jpg',
  },
  {
    id: 6,
    slug: 'hinahata-hina',
    name: 'Hina Hinahata',
    name_native: '日向端ひな',
    image: '/media/idols/hinahata-hina_thumb.jpg',
    face: '/media/idols/faces/hinahata-hina.jpg',
  },
  {
    id: 7,
    slug: 'hoshitani-mikuru',
    name: 'Mikuru Hoshitani',
    name_native: '星谷美来',
    image: '/media/idols/hoshitani-mikuru_thumb.jpg',
    face: '/media/idols/faces/hoshitani-mikuru.jpg',
  },
  {
    id: 8,
    slug: 'matsumoto-momona',
    name: 'Momona Matsumoto',
    name_native: '松本ももな',
    image: '/media/idols/matsumoto-momona_thumb.jpg',
    face: '/media/idols/faces/matsumoto-momona.jpg',
  },
  {
    id: 9,
    slug: 'momiyama-himeri',
    name: 'Himeri Momiyama',
    name_native: '籾山ひめり',
    image: '/media/idols/momiyama-himeri_thumb.jpg',
    face: '/media/idols/faces/momiyama-himeri.jpg',
  },
   {
     id: 10,
     slug: 'haruno-riri',
     name: 'Riri Haruno',
     name_native: '春野莉々',
     image: '/media/idols/haruno-riri_thumb.jpg',
     face: '/media/idols/faces/haruno-riri.jpg',
   }
]
