import type { ConceptNodeSummary, ConceptQuizSet } from '../types'

export const mockConceptNodes: ConceptNodeSummary[] = [
  {
    conceptNodeId: 'concept-cell-membrane',
    name: 'Màng tế bào',
    description: 'Cấu trúc bao bọc và điều tiết trao đổi chất của tế bào.',
    subject: 'Sinh học',
    hasQuiz: true,
  },
  {
    conceptNodeId: 'concept-newtons-laws',
    name: 'Định luật Newton',
    description: 'Ba định luật mô tả chuyển động và lực.',
    subject: 'Vật lý',
    hasQuiz: true,
  },
  {
    conceptNodeId: 'concept-acid-base',
    name: 'Axit và bazơ',
    description: 'Khái niệm pH, ion và phản ứng trung hòa.',
    subject: 'Hóa học',
    hasQuiz: true,
  },
  {
    conceptNodeId: 'concept-without-quiz',
    name: 'Khái niệm chưa có câu hỏi',
    description: 'Node demo để kiểm tra trạng thái chưa có dữ liệu.',
    subject: 'Demo',
    hasQuiz: false,
  },
]

export const mockConceptQuizzes: ConceptQuizSet[] = [
  {
    conceptNodeId: 'concept-cell-membrane',
    conceptName: 'Màng tế bào',
    questions: [
      {
        questionId: 'membrane-q1', conceptNodeId: 'concept-cell-membrane',
        prompt: 'Thành phần nào tạo nên phần lớn lớp kép của màng tế bào?',
        options: [
          { id: 'a', text: 'Phospholipid' }, { id: 'b', text: 'Tinh bột' },
          { id: 'c', text: 'DNA' }, { id: 'd', text: 'Cellulose đơn thuần' },
        ],
        correctOptionId: 'a', explanation: 'Phospholipid có đầu ưa nước và đuôi kỵ nước, tự sắp xếp thành lớp kép.',
      },
      {
        questionId: 'membrane-q2', conceptNodeId: 'concept-cell-membrane',
        prompt: 'Màng tế bào giúp tế bào thực hiện chức năng nào?',
        options: [
          { id: 'a', text: 'Tạo toàn bộ năng lượng cho cơ thể' }, { id: 'b', text: 'Điều tiết chất đi vào và đi ra' },
          { id: 'c', text: 'Lưu trữ mọi thông tin di truyền' }, { id: 'd', text: 'Tổng hợp tất cả protein' },
        ],
        correctOptionId: 'b', explanation: 'Màng có tính thấm chọn lọc, giúp kiểm soát trao đổi chất giữa tế bào và môi trường.',
      },
      {
        questionId: 'membrane-q3', conceptNodeId: 'concept-cell-membrane',
        prompt: 'Chất nào thường hỗ trợ vận chuyển ion qua màng?',
        options: [
          { id: 'a', text: 'Kênh protein' }, { id: 'b', text: 'Ribosome tự do' },
          { id: 'c', text: 'Thành cellulose' }, { id: 'd', text: 'Không bào khí' },
        ],
        correctOptionId: 'a', explanation: 'Các kênh protein tạo lối đi chọn lọc cho ion và một số phân tử phân cực.',
      },
    ],
  },
  {
    conceptNodeId: 'concept-newtons-laws',
    conceptName: 'Định luật Newton',
    questions: [
      {
        questionId: 'newton-q1', conceptNodeId: 'concept-newtons-laws',
        prompt: 'Nếu hợp lực tác dụng lên vật bằng 0, vật đang đứng yên sẽ thế nào?',
        options: [
          { id: 'a', text: 'Tiếp tục đứng yên' }, { id: 'b', text: 'Tăng tốc liên tục' },
          { id: 'c', text: 'Luôn chuyển động tròn' }, { id: 'd', text: 'Lập tức đổi khối lượng' },
        ],
        correctOptionId: 'a', explanation: 'Theo định luật I Newton, vật giữ nguyên trạng thái chuyển động khi hợp lực bằng 0.',
      },
      {
        questionId: 'newton-q2', conceptNodeId: 'concept-newtons-laws',
        prompt: 'Theo định luật II Newton, gia tốc phụ thuộc thế nào vào hợp lực?',
        options: [
          { id: 'a', text: 'Tỉ lệ thuận với hợp lực' }, { id: 'b', text: 'Tỉ lệ nghịch với hợp lực' },
          { id: 'c', text: 'Không phụ thuộc hợp lực' }, { id: 'd', text: 'Luôn bằng khối lượng' },
        ],
        correctOptionId: 'a', explanation: 'Công thức F = ma cho thấy với khối lượng không đổi, hợp lực tăng thì gia tốc tăng.',
      },
      {
        questionId: 'newton-q3', conceptNodeId: 'concept-newtons-laws',
        prompt: 'Lực và phản lực trong định luật III Newton có đặc điểm nào?',
        options: [
          { id: 'a', text: 'Cùng chiều và cùng tác dụng lên một vật' }, { id: 'b', text: 'Bằng nhau, ngược chiều và tác dụng lên hai vật' },
          { id: 'c', text: 'Luôn triệt tiêu trên cùng một vật' }, { id: 'd', text: 'Chỉ xuất hiện khi vật đứng yên' },
        ],
        correctOptionId: 'b', explanation: 'Hai lực tương tác có độ lớn bằng nhau, ngược chiều và đặt lên hai vật khác nhau.',
      },
      {
        questionId: 'newton-q4', conceptNodeId: 'concept-newtons-laws',
        prompt: 'Một vật 2 kg chịu hợp lực 6 N. Gia tốc của vật là bao nhiêu?',
        options: [
          { id: 'a', text: '3 m/s²' }, { id: 'b', text: '8 m/s²' },
          { id: 'c', text: '12 m/s²' }, { id: 'd', text: '0,33 m/s²' },
        ],
        correctOptionId: 'a', explanation: 'Từ F = ma, suy ra a = F/m = 6/2 = 3 m/s².',
      },
    ],
  },
  {
    conceptNodeId: 'concept-acid-base',
    conceptName: 'Axit và bazơ',
    questions: [
      {
        questionId: 'acid-q1', conceptNodeId: 'concept-acid-base',
        prompt: 'Dung dịch trung tính ở 25°C có pH bằng bao nhiêu?',
        options: [
          { id: 'a', text: '1' }, { id: 'b', text: '5' }, { id: 'c', text: '7' }, { id: 'd', text: '14' },
        ],
        correctOptionId: 'c', explanation: 'Ở 25°C, dung dịch trung tính có nồng độ H₃O⁺ và OH⁻ bằng nhau, pH = 7.',
      },
      {
        questionId: 'acid-q2', conceptNodeId: 'concept-acid-base',
        prompt: 'Theo Brønsted–Lowry, axit là chất như thế nào?',
        options: [
          { id: 'a', text: 'Nhận proton' }, { id: 'b', text: 'Cho proton' },
          { id: 'c', text: 'Luôn chứa oxygen' }, { id: 'd', text: 'Không tan trong nước' },
        ],
        correctOptionId: 'b', explanation: 'Axit Brønsted–Lowry là chất cho proton (H⁺) trong phản ứng.',
      },
      {
        questionId: 'acid-q3', conceptNodeId: 'concept-acid-base',
        prompt: 'Khi axit phản ứng với bazơ, sản phẩm thường gặp là gì?',
        options: [
          { id: 'a', text: 'Muối và nước' }, { id: 'b', text: 'Chỉ có oxygen' },
          { id: 'c', text: 'Kim loại nguyên chất' }, { id: 'd', text: 'Đường và carbon dioxide' },
        ],
        correctOptionId: 'a', explanation: 'Phản ứng trung hòa giữa axit và bazơ thường tạo muối và nước.',
      },
      {
        questionId: 'acid-q4', conceptNodeId: 'concept-acid-base',
        prompt: 'Một dung dịch có pH = 3 có tính chất nào?',
        options: [
          { id: 'a', text: 'Axit' }, { id: 'b', text: 'Bazơ' }, { id: 'c', text: 'Trung tính' }, { id: 'd', text: 'Không thể xác định' },
        ],
        correctOptionId: 'a', explanation: 'Ở 25°C, pH nhỏ hơn 7 biểu thị dung dịch có tính axit.',
      },
      {
        questionId: 'acid-q5', conceptNodeId: 'concept-acid-base',
        prompt: 'Chất chỉ thị quỳ tím thường đổi sang màu gì trong môi trường bazơ?',
        options: [
          { id: 'a', text: 'Đỏ' }, { id: 'b', text: 'Xanh' }, { id: 'c', text: 'Không màu' }, { id: 'd', text: 'Vàng' },
        ],
        correctOptionId: 'b', explanation: 'Quỳ tím chuyển xanh trong môi trường bazơ.',
      },
    ],
  },
]
