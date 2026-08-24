import { BaseService } from "@/services/base/BaseService";
import repairRecordApi from "@/api/repairRecord/repairRecordApi";
import type {
  CreateRepairRecordDto,
  RepairRecordApi,
  UpdateRepairRecordDto,
} from "@/interfaces/all/repairRecord";

class RepairRecordService extends BaseService<
  RepairRecordApi,
  CreateRepairRecordDto,
  UpdateRepairRecordDto
> {
  constructor() {
    super(repairRecordApi);
  }

  async createWithPhotos(
    data: CreateRepairRecordDto,
    files: File[],
    photoType: "before" | "after",
  ): Promise<RepairRecordApi> {
    const payload = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== "parts_replaced")
        payload.append(key, String(value));
    });
    payload.append("parts_replaced", JSON.stringify(data.parts_replaced ?? []));
    payload.append("photo_type", photoType);
    files.forEach((file) => payload.append("photos[]", file));
    const response = await this.api.create<RepairRecordApi, FormData>(payload);
    return response.data;
  }

  async updateWithPhotos(
    id: number,
    data: UpdateRepairRecordDto,
    files: File[],
    photoType: "before" | "after",
  ): Promise<RepairRecordApi> {
    const payload = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== "parts_replaced") {
        payload.append(key, String(value));
      }
    });
    payload.append("parts_replaced", JSON.stringify(data.parts_replaced ?? []));
    payload.append("photo_type", photoType);
    files.forEach((file) => payload.append("photos[]", file));
    const response = await this.api.updateMultipart<RepairRecordApi>(id, payload);
    return response.data;
  }
}

export const repairRecordService = new RepairRecordService();
export default repairRecordService;
