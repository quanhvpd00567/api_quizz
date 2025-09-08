/**
 * Subject Seeder
 * Creates sample subjects with class associations for testing
 */

import Subject from '#domains/Subject/Models/Subject'

export default class SubjectSeeder {
  public static async run() {
    console.log('🌱 Seeding subjects...')

    // Sample subjects with different class associations
    const subjects = [
      // Elementary subjects (Lớp 1-5)
      {
        name: 'Toán học',
        description: 'Môn học về số học, hình học và giải quyết vấn đề',
        code: 'MATH',
        color: '#3B82F6',
        icon: '📐',
        classes: ['lop1', 'lop2', 'lop3', 'lop4', 'lop5'],
        isActive: true,
      },
      {
        name: 'Tiếng Việt',
        description: 'Môn học về ngôn ngữ và văn học Việt Nam',
        code: 'VIET',
        color: '#EF4444',
        icon: '📖',
        classes: ['lop1', 'lop2', 'lop3', 'lop4', 'lop5'],
        isActive: true,
      },
      {
        name: 'Khoa học tự nhiên',
        description: 'Môn học về khoa học và tự nhiên',
        code: 'SCI',
        color: '#10B981',
        icon: '🔬',
        classes: ['lop3', 'lop4', 'lop5'],
        isActive: true,
      },

      // Middle school subjects (Lớp 6-9)
      {
        name: 'Toán học',
        description: 'Đại số, hình học và thống kê',
        code: 'MATH_MS',
        color: '#3B82F6',
        icon: '📐',
        classes: ['lop6', 'lop7', 'lop8', 'lop9'],
        isActive: true,
      },
      {
        name: 'Ngữ văn',
        description: 'Văn học và ngôn ngữ Việt Nam',
        code: 'LIT',
        color: '#EF4444',
        icon: '📚',
        classes: ['lop6', 'lop7', 'lop8', 'lop9'],
        isActive: true,
      },
      {
        name: 'Tiếng Anh',
        description: 'Ngôn ngữ tiếng Anh',
        code: 'ENG',
        color: '#8B5CF6',
        icon: '🇺🇸',
        classes: ['lop6', 'lop7', 'lop8', 'lop9'],
        isActive: true,
      },
      {
        name: 'Vật lý',
        description: 'Các định luật và hiện tượng vật lý',
        code: 'PHY',
        color: '#F59E0B',
        icon: '⚛️',
        classes: ['lop8', 'lop9'],
        isActive: true,
      },
      {
        name: 'Hóa học',
        description: 'Các phản ứng và nguyên tố hóa học',
        code: 'CHEM',
        color: '#06B6D4',
        icon: '🧪',
        classes: ['lop8', 'lop9'],
        isActive: true,
      },
      {
        name: 'Sinh học',
        description: 'Các sinh vật và quy luật sống',
        code: 'BIO',
        color: '#84CC16',
        icon: '🌱',
        classes: ['lop6', 'lop7', 'lop8', 'lop9'],
        isActive: true,
      },
      {
        name: 'Địa lý',
        description: 'Địa hình, khí hậu và con người',
        code: 'GEO',
        color: '#D97706',
        icon: '🌍',
        classes: ['lop6', 'lop7', 'lop8', 'lop9'],
        isActive: true,
      },
      {
        name: 'Lịch sử',
        description: 'Lịch sử Việt Nam và thế giới',
        code: 'HIST',
        color: '#92400E',
        icon: '📜',
        classes: ['lop6', 'lop7', 'lop8', 'lop9'],
        isActive: true,
      },

      // High school subjects (Lớp 10-12)
      {
        name: 'Toán học',
        description: 'Đại số, hình học, giải tích và xác suất thống kê',
        code: 'MATH_HS',
        color: '#3B82F6',
        icon: '📐',
        classes: ['lop10', 'lop11', 'lop12'],
        isActive: true,
      },
      {
        name: 'Ngữ văn',
        description: 'Văn học Việt Nam và thế giới',
        code: 'LIT_HS',
        color: '#EF4444',
        icon: '📚',
        classes: ['lop10', 'lop11', 'lop12'],
        isActive: true,
      },
      {
        name: 'Tiếng Anh',
        description: 'Ngôn ngữ tiếng Anh nâng cao',
        code: 'ENG_HS',
        color: '#8B5CF6',
        icon: '🇺🇸',
        classes: ['lop10', 'lop11', 'lop12'],
        isActive: true,
      },
      {
        name: 'Vật lý',
        description: 'Cơ học, điện học, quang học và vật lý hiện đại',
        code: 'PHY_HS',
        color: '#F59E0B',
        icon: '⚛️',
        classes: ['lop10', 'lop11', 'lop12'],
        isActive: true,
      },
      {
        name: 'Hóa học',
        description: 'Hóa học vô cơ, hữu cơ và phân tích',
        code: 'CHEM_HS',
        color: '#06B6D4',
        icon: '🧪',
        classes: ['lop10', 'lop11', 'lop12'],
        isActive: true,
      },
      {
        name: 'Sinh học',
        description: 'Sinh học tế bào, di truyền và tiến hóa',
        code: 'BIO_HS',
        color: '#84CC16',
        icon: '🌱',
        classes: ['lop10', 'lop11', 'lop12'],
        isActive: true,
      },

      // Universal subjects (all classes)
      {
        name: 'Thể dục',
        description: 'Giáo dục thể chất và thể thao',
        code: 'PE',
        color: '#F97316',
        icon: '⚽',
        classes: ['all'],
        isActive: true,
      },
      {
        name: 'Giáo dục công dân',
        description: 'Giáo dục đạo đức và kỹ năng sống',
        code: 'CIVIC',
        color: '#6366F1',
        icon: '🤝',
        classes: ['all'],
        isActive: true,
      },
      {
        name: 'Tin học',
        description: 'Công nghệ thông tin và lập trình',
        code: 'IT',
        color: '#EC4899',
        icon: '💻',
        classes: ['lop6', 'lop7', 'lop8', 'lop9', 'lop10', 'lop11', 'lop12'],
        isActive: true,
      },
    ]

    try {
      // Clear existing subjects (optional - remove if you want to keep existing data)
      // await Subject.deleteMany({})

      // Insert subjects
      for (const subjectData of subjects) {
        const existingSubject = await Subject.findOne({ code: subjectData.code })
        
        if (!existingSubject) {
          await Subject.create(subjectData)
          console.log(`✅ Created subject: ${subjectData.name} (${subjectData.code})`)
        } else {
          console.log(`⏭️  Subject already exists: ${subjectData.name} (${subjectData.code})`)
        }
      }

      const subjectsCount = await Subject.countDocuments()
      console.log(`🎉 Subjects seeding completed! Total subjects: ${subjectsCount}`)

    } catch (error) {
      console.error('❌ Error seeding subjects:', error)
      throw error
    }
  }
}
