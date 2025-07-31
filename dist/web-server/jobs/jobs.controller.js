"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("../queue/queue.service");
let JobsController = class JobsController {
    constructor(queueService) {
        this.queueService = queueService;
    }
    async postJob(payload, res) {
        try {
            if (!payload.jobName || !payload.arguments) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Input data is required.' });
            }
            const job = await this.queueService.addJobToQueue(payload);
            return res.status(common_1.HttpStatus.ACCEPTED).json({
                message: 'Job submitted successfully',
                jobId: job.id,
                status: 'queued',
            });
        }
        catch (error) {
            console.error('Error submitting job:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Failed to submit job',
                error: error.message,
            });
        }
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Post)('/jobs'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "postJob", null);
exports.JobsController = JobsController = __decorate([
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map