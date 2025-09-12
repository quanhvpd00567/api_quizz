import GenerateQuizzHistory from '#domains/Quiz/Models/GenerateQuizzHistory'

export default class AiService {
    /**
     * Truy vấn danh sách tiến trình AI
     */
    static async queryProcess(filters: any) {
        const {
            page = 1,
            limit = 10,
            subject = '',
            status = '',
            model = '',
        } = filters
        const query: any = {}
        if (subject) query.subject = subject
        if (status) query.status = status
        if (model) query.model = model


        const options = {
            page,
            limit: Number(limit),
            collation: {
                locale: 'en',
            },
        };

        console.log('Querying AI process with filters:', options    );
        

        const result = await GenerateQuizzHistory.paginate(query, options);

        return {
            data: result.docs,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.totalDocs,
                totalPages: result.totalPages,
            },
        };
    }
}

