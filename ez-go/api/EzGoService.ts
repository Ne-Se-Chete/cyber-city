import { JunctionRepository as JunctionDao } from "ez-go/gen/ez-go/dao/Junction/JunctionRepository";
import { JunctionDataRepository as JunctionDataDao } from "ez-go/gen/ez-go/dao/JunctionData/JunctionDataRepository";
import { EdgeRepository as EdgeDao } from "ez-go/gen/ez-go/dao/Edge/EdgeRepository";

import { Controller, Get, Post, response } from "sdk/http";

@Controller
class EzGoService {
    private readonly junctionDao;
    private readonly junctionDataDao;
    private readonly edgeDao;

    constructor() {
        this.junctionDao = new JunctionDao();
        this.junctionDataDao = new JunctionDataDao();
        this.edgeDao = new EdgeDao();
    }

    @Get("/Junctions")
    public getJunctions() {
        const allJunctions = this.junctionDao.findAll();
        return allJunctions;
    }

    @Get("/Edges")
    public getEdges() {
        const allEdges = this.edgeDao.findAll();
        return allEdges;
    }

    @Get("/JunctionDataMap")
    public getJunctionDataMap() {
        const allJunctions = this.junctionDao.findAll();
        const allJunctionData = this.junctionDataDao.findAll();

        const junctionDataMap = new Map(
            allJunctionData.map(data => [data.Junction, data])
        );

        const junctionsWithData = allJunctions.map(junction => ({
            ...junction,
            Data: junctionDataMap.get(junction.Id) || null,
        }));

        return junctionsWithData;
    }

    @Post("/JunctionData")
    public createJunctionData(body: any) {
        try {
            ["Junction", "IsRaining", "Timestamp", "IsFallen", "IsNoisy", "IsAmbulancePassing", "IsFoggy"].forEach(field => {
                if (!body[field]) {
                    response.setStatus(response.BAD_REQUEST);
                    return `Missing required field: ${field}`;
                }
            });

            const junction = this.junctionDao.findById(body.Junction);
            if (!junction) {
                response.setStatus(response.BAD_REQUEST);
                return "Invalid Junction ID";
            }

            const newJunctionData = this.junctionDataDao.create({
                Junction: body.Junction,
                IsRaining: body.IsRaining,
                Timestamp: body.Timestamp,
                IsFallen: body.IsFallen,
                IsNoisy: body.IsNoisy,
                IsAmbulancePassing: body.IsAmbulancePassing,
                IsFoggy: body.IsFoggy
            });

            return newJunctionData;
        } catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return `An error occurred while creating junction data: ${error}`;
        }
    }
}
