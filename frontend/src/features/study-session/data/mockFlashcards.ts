import type { Flashcard, RatingOption } from '../types/flashcard'

export const MOCK_STUDY_DECK_ID = 'mock-deck-science-basics'

export const mockFlashcards: Flashcard[] = [
  {
    id: 'active-recall-01',
    deckName: 'Khoa học tự nhiên · Cơ bản',
    subject: 'SINH HỌC',
    prompt: 'Ti thể có vai trò gì trong tế bào?',
    answer:
      'Ti thể tạo ra phần lớn ATP — nguồn năng lượng mà tế bào sử dụng cho các hoạt động sống. Vì vậy, ti thể thường được gọi là “nhà máy năng lượng” của tế bào.',
    hint: 'Hãy nghĩ đến nơi tế bào tạo ra năng lượng.',
  },
  {
    id: 'active-recall-02',
    deckName: 'Khoa học tự nhiên · Cơ bản',
    subject: 'VẬT LÝ',
    prompt: 'Định luật II Newton được viết như thế nào?',
    answer:
      'Hợp lực tác dụng lên một vật bằng khối lượng nhân với gia tốc của vật: F = m × a. Gia tốc cùng hướng với hợp lực.',
    hint: 'Một công thức gồm lực, khối lượng và gia tốc.',
  },
  {
    id: 'active-recall-03',
    deckName: 'Khoa học tự nhiên · Cơ bản',
    subject: 'HÓA HỌC',
    prompt: 'pH của một dung dịch trung tính ở 25°C bằng bao nhiêu?',
    answer:
      'pH bằng 7. Ở 25°C, dung dịch có pH nhỏ hơn 7 là axit, còn lớn hơn 7 là bazơ.',
    hint: 'Nằm chính giữa thang pH từ 0 đến 14.',
  },
  {
    id: 'active-recall-04',
    deckName: 'Khoa học tự nhiên · Cơ bản',
    subject: 'THIÊN VĂN',
    prompt: 'Hành tinh nào lớn nhất trong Hệ Mặt Trời?',
    answer:
      'Sao Mộc là hành tinh lớn nhất trong Hệ Mặt Trời. Khối lượng của nó lớn hơn tổng khối lượng của tất cả các hành tinh còn lại.',
    hint: 'Một hành tinh khí khổng lồ có Vết Đỏ Lớn.',
  },
  {
    id: 'active-recall-05',
    deckName: 'Khoa học tự nhiên · Cơ bản',
    subject: 'ĐỊA LÝ',
    prompt: 'Đường xích đạo chia Trái Đất thành hai bán cầu nào?',
    answer:
      'Đường xích đạo chia Trái Đất thành bán cầu Bắc và bán cầu Nam.',
    hint: 'Một bán cầu nằm phía trên, một bán cầu nằm phía dưới đường xích đạo.',
  },
]

export const ratingOptions: RatingOption[] = [
  {
    value: 'again',
    label: 'Again',
    description: 'Chưa nhớ',
    shortcut: '1',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Khó nhớ',
    shortcut: '2',
  },
  {
    value: 'good',
    label: 'Good',
    description: 'Nhớ được',
    shortcut: '3',
  },
  {
    value: 'easy',
    label: 'Easy',
    description: 'Dễ dàng',
    shortcut: '4',
  },
]
