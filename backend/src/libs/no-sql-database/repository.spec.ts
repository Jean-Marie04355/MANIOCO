import { NoSqlRepository } from './repository';

describe('NoSqlRepository', () => {
  let repository: NoSqlRepository<any>;
  let modelMock: any;

  beforeEach(() => {
    modelMock = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: '1', ...data }),
    }));
    modelMock.find = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
    modelMock.findOne = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    modelMock.findByIdAndUpdate = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    modelMock.deleteOne = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    modelMock.countDocuments = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

    repository = new NoSqlRepository(modelMock);
  });

  it('should call find', async () => {
    const result = await repository.find({});
    expect(modelMock.find).toHaveBeenCalledWith({ deletedAt: null });
    expect(result).toEqual([]);
  });

  it('should call find without filter', async () => {
    await repository.find();
    expect(modelMock.find).toHaveBeenCalledWith({ deletedAt: null });
  });

  it('should call findOne', async () => {
    await repository.findOne({ email: 'test@test.com' });
    expect(modelMock.findOne).toHaveBeenCalledWith({
      email: 'test@test.com',
      deletedAt: null,
    });
  });

  it('should create a document', async () => {
    const result = await repository.create({ name: 'test' });
    expect(result).toBeDefined();
  });

  it('should save an entity', async () => {
    const entity = { save: jest.fn().mockResolvedValue({ id: '1' }) };
    await repository.save(entity as any);
    expect(entity.save).toHaveBeenCalled();
  });

  it('should call update', async () => {
    await repository.update('1', { name: 'updated' });
    expect(modelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { name: 'updated' },
      { new: true },
    );
  });

  it('should call delete', async () => {
    await repository.delete('1');
    expect(modelMock.deleteOne).toHaveBeenCalledWith({ _id: '1' });
  });

  it('should call count', async () => {
    const result = await repository.count({});
    expect(modelMock.countDocuments).toHaveBeenCalledWith({ deletedAt: null });
    expect(result).toBe(0);
  });

  it('should call count without filter', async () => {
    await repository.count();
    expect(modelMock.countDocuments).toHaveBeenCalledWith({ deletedAt: null });
  });

  it('should call softDelete', async () => {
    await repository.softDelete('1');
    expect(modelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
  });
});
